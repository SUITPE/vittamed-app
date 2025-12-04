/**
 * API Route: /api/appointment-series
 * Ticket: VT-96 - API CRUD de Series Recurrentes
 *
 * POST - Create a new appointment series (generates all appointments)
 * GET  - List appointment series with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-server';
import { customAuth } from '@/lib/custom-auth';
import {
  RecurrenceType,
  CreateAppointmentSeriesResponse,
} from '@/types/appointment-series';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateSeriesSchema = z.object({
  patient_id: z.string().uuid('ID de paciente inválido'),
  service_id: z.string().uuid('ID de servicio inválido'),
  doctor_id: z.string().uuid('ID de doctor inválido').optional(),
  member_id: z.string().uuid('ID de miembro inválido').optional(),
  recurrence_type: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom']),
  recurrence_interval: z.number().int().min(1).max(12).default(1),
  recurrence_days: z.array(z.number().int().min(0).max(6)).default([]),
  base_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido (HH:MM)'),
  duration_minutes: z.number().int().min(5).max(480).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional(),
  max_occurrences: z.number().int().min(1).max(100).optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => data.doctor_id || data.member_id,
  { message: 'Debe especificar doctor_id o member_id', path: ['doctor_id'] }
).refine(
  (data) => data.end_date || data.max_occurrences,
  { message: 'Debe especificar end_date o max_occurrences', path: ['end_date'] }
);

// ============================================================================
// POST - Create Appointment Series
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await customAuth.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Validate request body
    const body = await request.json();
    const validationResult = CreateSeriesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const supabase = await createAdminClient();

    // 3. Verify user has permission (tenant access)
    const tenantId = user.profile?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant asignado' }, { status: 403 });
    }

    // 4. Verify patient exists and belongs to tenant
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email')
      .eq('id', data.patient_id)
      .eq('tenant_id', tenantId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // 5. Verify service exists and belongs to tenant
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, duration, price')
      .eq('id', data.service_id)
      .eq('tenant_id', tenantId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    // 6. Verify provider exists
    if (data.doctor_id) {
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', data.doctor_id)
        .eq('tenant_id', tenantId)
        .single();

      if (doctorError || !doctor) {
        return NextResponse.json({ error: 'Doctor no encontrado' }, { status: 404 });
      }
    } else if (data.member_id) {
      const { data: member, error: memberError } = await supabase
        .from('custom_users')
        .select('id')
        .eq('id', data.member_id)
        .eq('tenant_id', tenantId)
        .single();

      if (memberError || !member) {
        return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 });
      }
    }

    // 7. Calculate appointment dates
    const duration = data.duration_minutes || service.duration || 30;
    const appointmentDates = calculateAppointmentDates({
      recurrence_type: data.recurrence_type,
      recurrence_interval: data.recurrence_interval,
      recurrence_days: data.recurrence_days,
      start_date: data.start_date,
      end_date: data.end_date,
      max_occurrences: data.max_occurrences,
      base_time: data.base_time,
    });

    if (appointmentDates.length === 0) {
      return NextResponse.json({ error: 'No se generaron fechas de cita' }, { status: 400 });
    }

    // 8. Check availability for all dates
    const conflicts: Array<{ date: string; occurrence: number; reason: string }> = [];

    for (let i = 0; i < appointmentDates.length; i++) {
      const date = appointmentDates[i];
      const startTime = new Date(date);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      // Check for existing appointments at this time
      const conflictQuery = supabase
        .from('appointments')
        .select('id')
        .eq('tenant_id', tenantId)
        .gte('start_time', startTime.toISOString())
        .lt('start_time', endTime.toISOString())
        .neq('status', 'cancelled');

      if (data.doctor_id) {
        conflictQuery.eq('doctor_id', data.doctor_id);
      }
      if (data.member_id) {
        conflictQuery.eq('assigned_member_id', data.member_id);
      }

      const { data: existingAppts } = await conflictQuery;

      if (existingAppts && existingAppts.length > 0) {
        conflicts.push({
          date: date.toISOString(),
          occurrence: i + 1,
          reason: `Ya existe una cita a las ${startTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`,
        });
      }
    }

    // If more than 20% conflicts, reject
    if (conflicts.length > appointmentDates.length * 0.2) {
      return NextResponse.json(
        {
          error: 'Demasiados conflictos de horario',
          conflicts,
          message: `${conflicts.length} de ${appointmentDates.length} citas tienen conflicto`,
        },
        { status: 409 }
      );
    }

    // 9. Create series in database
    const { data: series, error: seriesError } = await supabase
      .from('appointment_series')
      .insert({
        tenant_id: tenantId,
        patient_id: data.patient_id,
        doctor_id: data.doctor_id || null,
        member_id: data.member_id || null,
        service_id: data.service_id,
        recurrence_type: data.recurrence_type,
        recurrence_interval: data.recurrence_interval,
        recurrence_days: data.recurrence_days,
        base_time: `${data.base_time}:00`,
        duration_minutes: duration,
        start_date: data.start_date,
        end_date: data.end_date || null,
        max_occurrences: data.max_occurrences || null,
        status: 'active',
        notes: data.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (seriesError || !series) {
      console.error('[API] Error creating series:', seriesError);
      return NextResponse.json(
        { error: 'Error al crear serie', details: seriesError?.message },
        { status: 500 }
      );
    }

    // 10. Create appointments (excluding conflicts)
    const validDates = appointmentDates.filter((_, i) =>
      !conflicts.some(c => c.occurrence === i + 1)
    );

    const appointmentsToInsert = validDates.map((date, i) => {
      const startTime = new Date(date);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      return {
        tenant_id: tenantId,
        patient_id: data.patient_id,
        doctor_id: data.doctor_id || null,
        assigned_member_id: data.member_id || null,
        service_id: data.service_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'pending',
        series_id: series.id,
        series_occurrence: i + 1,
        notes: data.notes ? `Serie: ${data.notes}` : null,
      };
    });

    const { data: createdAppointments, error: apptError } = await supabase
      .from('appointments')
      .insert(appointmentsToInsert)
      .select('id, start_time, end_time, series_occurrence, status');

    if (apptError) {
      console.error('[API] Error creating appointments:', apptError);
      // Rollback: delete the series
      await supabase.from('appointment_series').delete().eq('id', series.id);
      return NextResponse.json(
        { error: 'Error al crear citas', details: apptError.message },
        { status: 500 }
      );
    }

    // 11. Return response
    const response: CreateAppointmentSeriesResponse = {
      series: {
        ...series,
        patient: {
          id: patient.id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          email: patient.email,
        },
        service: {
          id: service.id,
          name: service.name,
          duration: service.duration,
          price: service.price,
        },
      },
      appointments: createdAppointments || [],
      total_appointments: createdAppointments?.length || 0,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };

    console.log(`[API] Series created: ${series.id} with ${createdAppointments?.length} appointments`);

    return NextResponse.json(response, { status: 201 });
  } catch (error: unknown) {
    console.error('[API] Unexpected error in POST /api/appointment-series:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ============================================================================
// GET - List Appointment Series
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await customAuth.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = user.profile?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant asignado' }, { status: 403 });
    }

    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);

    // 2. Parse query parameters
    const patientId = searchParams.get('patient_id');
    const doctorId = searchParams.get('doctor_id');
    const memberId = searchParams.get('member_id');
    const serviceId = searchParams.get('service_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const includeAppointments = searchParams.get('include_appointments') === 'true';

    // 3. Build query
    let query = supabase
      .from('appointment_series')
      .select(`
        *,
        patient:patients!appointment_series_patient_id_fkey(id, first_name, last_name, email),
        doctor:doctors!appointment_series_doctor_id_fkey(id, first_name, last_name),
        member:custom_users!appointment_series_member_id_fkey(id, first_name, last_name),
        service:services!appointment_series_service_id_fkey(id, name, duration, price)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (patientId) query = query.eq('patient_id', patientId);
    if (doctorId) query = query.eq('doctor_id', doctorId);
    if (memberId) query = query.eq('member_id', memberId);
    if (serviceId) query = query.eq('service_id', serviceId);
    if (status) query = query.eq('status', status);

    // Pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: series, error, count } = await query;

    if (error) {
      console.error('[API] Error listing series:', error);
      return NextResponse.json({ error: 'Error al obtener series' }, { status: 500 });
    }

    // 4. Optionally fetch appointment counts
    let seriesWithCounts = series || [];

    if (includeAppointments) {
      seriesWithCounts = await Promise.all(
        (series || []).map(async (s) => {
          const { count: apptCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('series_id', s.id);

          return { ...s, appointment_count: apptCount || 0 };
        })
      );
    }

    return NextResponse.json({
      series: seriesWithCounts,
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > offset + limit,
    });
  } catch (error: unknown) {
    console.error('[API] Unexpected error in GET /api/appointment-series:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface CalculateDatesParams {
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  recurrence_days: number[];
  start_date: string;
  end_date?: string;
  max_occurrences?: number;
  base_time: string;
}

/**
 * Calculate all appointment dates for a series
 */
function calculateAppointmentDates(params: CalculateDatesParams): Date[] {
  const {
    recurrence_type,
    recurrence_interval,
    recurrence_days,
    start_date,
    end_date,
    max_occurrences,
    base_time,
  } = params;

  const dates: Date[] = [];
  const [hours, minutes] = base_time.split(':').map(Number);

  // Parse dates
  const start = new Date(start_date);
  start.setHours(hours, minutes, 0, 0);

  const end = end_date ? new Date(end_date) : null;
  if (end) end.setHours(23, 59, 59, 999);

  const maxCount = max_occurrences || 100;
  let current = new Date(start);
  let count = 0;

  // Safety: max 365 iterations
  const maxIterations = 365;
  let iterations = 0;

  while (count < maxCount && iterations < maxIterations) {
    iterations++;

    // Check end date
    if (end && current > end) break;

    // Check if this day matches recurrence_days (for weekly/custom)
    const dayOfWeek = current.getDay();
    const matchesDay =
      recurrence_type === 'daily' ||
      recurrence_type === 'monthly' ||
      recurrence_days.length === 0 ||
      recurrence_days.includes(dayOfWeek);

    if (matchesDay && current >= start) {
      dates.push(new Date(current));
      count++;
    }

    // Move to next occurrence
    switch (recurrence_type) {
      case 'daily':
        current.setDate(current.getDate() + recurrence_interval);
        break;

      case 'weekly':
        if (recurrence_days.length > 0) {
          // Move to next matching day
          let nextDay = current.getDay() + 1;
          let daysToAdd = 0;

          // Find next matching day
          for (let i = 0; i < 7; i++) {
            const checkDay = (nextDay + i) % 7;
            if (recurrence_days.includes(checkDay)) {
              daysToAdd = i + 1;
              break;
            }
          }

          // If we've gone through all days, add week interval
          if (daysToAdd === 7 || (count > 0 && recurrence_days.indexOf(dayOfWeek) === recurrence_days.length - 1)) {
            daysToAdd += (recurrence_interval - 1) * 7;
          }

          current.setDate(current.getDate() + daysToAdd);
        } else {
          current.setDate(current.getDate() + 7 * recurrence_interval);
        }
        break;

      case 'biweekly':
        current.setDate(current.getDate() + 14);
        break;

      case 'monthly':
        current.setMonth(current.getMonth() + recurrence_interval);
        break;

      case 'custom':
        // For custom, just go day by day and check recurrence_days
        current.setDate(current.getDate() + 1);
        break;
    }
  }

  return dates;
}
