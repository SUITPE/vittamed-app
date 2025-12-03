/**
 * API Route: POST /api/appointments/[appointmentId]/rebook
 * Ticket: VT-183 - API: Reschedule Appointment
 *
 * Rebooks a completed/no-show/cancelled appointment.
 * Creates a new appointment based on the original but for a new date.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';
import { customAuth } from '@/lib/custom-auth';
import type { RescheduleAppointmentResponse } from '@/types/reschedule';
import { canRebookStatus } from '@/types/reschedule';

// Validation schema for rebook
const RebookRequestSchema = z.object({
  new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  new_start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS format'),
  new_end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS format').optional(),
  new_doctor_id: z.string().uuid().optional(),
  new_member_id: z.string().uuid().optional(),
  new_assigned_member_id: z.string().uuid().optional(),
  new_service_id: z.string().uuid().optional(),
  notes: z.string().optional(),
  send_notification: z.boolean().optional().default(true),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params;
  console.log('[POST /rebook] START - appointmentId:', appointmentId);

  try {
    // 1. Authenticate user
    const user = await customAuth.getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userAccess = {
      id: user.id,
      role: user.profile.role,
      tenant_id: user.profile.tenant_id,
    };

    // 2. Parse and validate request body
    const body = await request.json();
    const parseResult = RebookRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const validatedData = parseResult.data;

    // 3. Get the original appointment
    const supabase = await createClient();
    const { data: originalAppointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        services (
          id,
          name,
          duration_minutes
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (fetchError || !originalAppointment) {
      console.error('[Rebook] Appointment not found:', fetchError);
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // 4. Check authorization
    const isAdminOrStaff = ['admin_tenant', 'receptionist', 'staff'].includes(userAccess.role);
    const isOwnDoctor = userAccess.role === 'doctor' && originalAppointment.doctor_id === user.id;
    const isOwnMember = userAccess.role === 'member' && originalAppointment.assigned_member_id === user.id;
    const isSameTenant = userAccess.tenant_id === originalAppointment.tenant_id;

    const canRebook = (isAdminOrStaff || isOwnDoctor || isOwnMember) && isSameTenant;

    if (!canRebook) {
      return NextResponse.json(
        { error: 'You do not have permission to rebook this appointment' },
        { status: 403 }
      );
    }

    // 5. Check if appointment status allows rebooking
    if (!canRebookStatus(originalAppointment.status)) {
      return NextResponse.json(
        {
          error: 'Cannot rebook this appointment',
          reasons: [`El estado "${originalAppointment.status}" no permite re-reservar. Solo se puede re-reservar citas completadas, no-show o canceladas.`],
        },
        { status: 400 }
      );
    }

    // 6. Get service details (use new service if provided, otherwise original)
    const serviceId = validatedData.new_service_id || originalAppointment.service_id;
    let serviceDuration: number | undefined;

    if (validatedData.new_service_id) {
      const { data: newService } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', serviceId)
        .single();
      serviceDuration = newService?.duration_minutes;
    } else {
      const service = Array.isArray(originalAppointment.services)
        ? originalAppointment.services[0]
        : originalAppointment.services;
      serviceDuration = service?.duration_minutes;
    }

    // 7. Calculate end time if not provided
    let newEndTime = validatedData.new_end_time;
    if (!newEndTime && serviceDuration) {
      const [hours, minutes] = validatedData.new_start_time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + serviceDuration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;
    } else if (!newEndTime) {
      newEndTime = originalAppointment.end_time;
    }

    // 8. Check availability for the new time slot
    const doctorId = validatedData.new_doctor_id || originalAppointment.doctor_id;
    const assignedMemberId = validatedData.new_assigned_member_id || originalAppointment.assigned_member_id;

    let conflictQuery = supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', originalAppointment.tenant_id)
      .eq('appointment_date', validatedData.new_date)
      .in('status', ['pending', 'confirmed'])
      .gte('end_time', validatedData.new_start_time)
      .lte('start_time', newEndTime);

    if (doctorId) {
      conflictQuery = conflictQuery.eq('doctor_id', doctorId);
    } else if (assignedMemberId) {
      conflictQuery = conflictQuery.eq('assigned_member_id', assignedMemberId);
    }

    const { data: conflictingAppointments } = await conflictQuery;

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'The selected time slot is not available' },
        { status: 409 }
      );
    }

    // 9. Use admin client for database operations
    const adminClient = createAdminClient();

    // 10. Create new appointment (rebook)
    const newAppointmentData = {
      tenant_id: originalAppointment.tenant_id,
      patient_id: originalAppointment.patient_id,
      service_id: serviceId,
      doctor_id: doctorId,
      member_id: validatedData.new_member_id || originalAppointment.member_id,
      assigned_member_id: assignedMemberId,
      appointment_date: validatedData.new_date,
      start_time: validatedData.new_start_time,
      end_time: newEndTime,
      status: 'pending',
      notes: validatedData.notes || null,
      total_amount: originalAppointment.total_amount,
      // Rebook tracking fields
      original_appointment_id: originalAppointment.original_appointment_id || originalAppointment.id,
      rescheduled_from_id: originalAppointment.id,
      rescheduled_at: new Date().toISOString(),
      rescheduled_by: user.id,
      reschedule_reason: `Re-reserva de cita ${originalAppointment.status}`,
      reschedule_count: 0, // Reset count for rebooks
      is_rebook: true,
    };

    const { data: newAppointment, error: createError } = await adminClient
      .from('appointments')
      .insert(newAppointmentData)
      .select()
      .single();

    if (createError) {
      console.error('[Rebook] Create error:', createError);
      return NextResponse.json(
        { error: 'Failed to create new appointment' },
        { status: 500 }
      );
    }

    // 11. TODO: Send notifications if requested

    const response: RescheduleAppointmentResponse = {
      success: true,
      new_appointment: newAppointment,
      original_appointment: originalAppointment,
      reschedule_count: 0,
      message: 'Appointment rebooked successfully',
      notification_sent: false,
    };

    console.log('[Rebook] SUCCESS - new appointment:', newAppointment.id);
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[Rebook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/appointments/[appointmentId]/rebook
 * Check if an appointment can be rebooked
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params;

  try {
    const user = await customAuth.getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('id, status, tenant_id')
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check tenant access
    if (user.profile.tenant_id !== appointment.tenant_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const canRebook = canRebookStatus(appointment.status);

    return NextResponse.json({
      appointment_id: appointmentId,
      can_rebook: canRebook,
      current_status: appointment.status,
      reasons: canRebook
        ? []
        : [`El estado "${appointment.status}" no permite re-reservar`],
      allowed_statuses: ['completed', 'no_show', 'cancelled'],
    });

  } catch (error) {
    console.error('[GET /rebook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
