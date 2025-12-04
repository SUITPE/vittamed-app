/**
 * API Route: GET /api/doctors/[doctorId]/available-slots
 *
 * Returns suggested available appointment slots for a doctor
 * across a date range based on their availability schedule.
 *
 * TASK: VT-192
 * Epic: Gestión Avanzada de Agenda
 *
 * Query Parameters:
 * - base_date: Starting date (YYYY-MM-DD), defaults to today
 * - duration_minutes: Service duration (default: 30)
 * - suggestion_type: 'next_week' | 'two_weeks' | 'month' (default: 'next_week')
 * - tenant_id: Optional tenant ID for cross-tenant access
 * - max_per_day: Max slots per day (default: 10)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { customAuth } from '@/lib/custom-auth';
import type {
  AvailableSlotsResponse,
  AvailableSlot,
  DailySlots,
  SlotSuggestionType,
} from '@/types/available-slots';
import { DAY_NAMES_ES, getDateRangeEnd, formatDateYMD } from '@/types/available-slots';

// Validation schema for query params
const QueryParamsSchema = z.object({
  base_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .optional(),
  duration_minutes: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().min(5).max(480))
    .optional(),
  suggestion_type: z.enum(['next_week', 'two_weeks', 'month']).optional(),
  tenant_id: z.string().uuid().optional(),
  max_per_day: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().min(1).max(50))
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
): Promise<NextResponse<AvailableSlotsResponse>> {
  const { doctorId } = await params;

  try {
    // 1. Authenticate user
    const user = await customAuth.getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse and validate query params
    const { searchParams } = new URL(request.url);
    const rawParams = {
      base_date: searchParams.get('base_date') || undefined,
      duration_minutes: searchParams.get('duration_minutes') || undefined,
      suggestion_type: searchParams.get('suggestion_type') || undefined,
      tenant_id: searchParams.get('tenant_id') || undefined,
      max_per_day: searchParams.get('max_per_day') || undefined,
    };

    const parseResult = QueryParamsSchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parseResult.error.issues } as AvailableSlotsResponse & { details: unknown },
        { status: 400 }
      );
    }

    const {
      base_date,
      duration_minutes = 30,
      suggestion_type = 'next_week',
      tenant_id,
      max_per_day = 10,
    } = parseResult.data;

    // 3. Get supabase client
    const supabase = await createClient();

    // 4. Get doctor profile
    const { data: doctorProfile, error: profileError } = await supabase
      .from('custom_users')
      .select('id, email, full_name, tenant_id')
      .eq('id', doctorId)
      .single();

    if (profileError || !doctorProfile) {
      return NextResponse.json(
        { success: false, error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // 5. Determine tenant ID
    const targetTenantId = tenant_id || doctorProfile.tenant_id;
    if (!targetTenantId) {
      return NextResponse.json(
        { success: false, error: 'Doctor not assigned to any tenant' },
        { status: 404 }
      );
    }

    // 6. Verify tenant access
    const isOwnTenant = user.profile.tenant_id === targetTenantId;
    const isSuperAdmin = user.profile.role === 'super_admin';
    if (!isOwnTenant && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this tenant' },
        { status: 403 }
      );
    }

    // 7. Get doctor_tenant relationship
    const { data: doctorTenant, error: dtError } = await supabase
      .from('doctor_tenants')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('tenant_id', targetTenantId)
      .eq('is_active', true)
      .single();

    if (dtError || !doctorTenant) {
      return NextResponse.json(
        { success: false, error: 'Doctor not active in this tenant' },
        { status: 404 }
      );
    }

    // 8. Get doctor's availability schedule
    const { data: availability, error: availError } = await supabase
      .from('doctor_availability')
      .select('day_of_week, start_time, end_time, is_active')
      .eq('doctor_tenant_id', doctorTenant.id)
      .eq('is_active', true);

    if (availError) {
      console.error('[available-slots] Error fetching availability:', availError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch doctor availability' },
        { status: 500 }
      );
    }

    if (!availability || availability.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          doctor_id: doctorId,
          doctor_name: doctorProfile.full_name || undefined,
          tenant_id: targetTenantId,
          date_range: { start: '', end: '' },
          duration_minutes,
          total_slots: 0,
          days: [],
          next_available: [],
        },
      });
    }

    // 9. Calculate date range
    const baseDate = base_date ? new Date(base_date + 'T00:00:00') : new Date();
    // Ensure we start from tomorrow if base_date is today and current time is past business hours
    if (baseDate.toDateString() === new Date().toDateString()) {
      const now = new Date();
      if (now.getHours() >= 18) {
        baseDate.setDate(baseDate.getDate() + 1);
      }
    }
    const endDate = getDateRangeEnd(baseDate, suggestion_type as SlotSuggestionType);

    // 10. Get doctor breaks for all days
    const { data: breaks } = await supabase
      .from('doctor_breaks')
      .select('day_of_week, start_time, end_time')
      .eq('doctor_tenant_id', doctorTenant.id)
      .eq('is_active', true);

    // 11. Get existing appointments in date range
    const { data: appointments } = await supabase
      .from('appointments')
      .select('appointment_date, start_time, end_time')
      .eq('doctor_id', doctorId)
      .eq('tenant_id', targetTenantId)
      .gte('appointment_date', formatDateYMD(baseDate))
      .lte('appointment_date', formatDateYMD(endDate))
      .not('status', 'eq', 'cancelled');

    // 12. Create availability map by day of week
    const availabilityMap = new Map<number, { start_time: string; end_time: string }[]>();
    availability.forEach((avail) => {
      const existing = availabilityMap.get(avail.day_of_week) || [];
      existing.push({ start_time: avail.start_time, end_time: avail.end_time });
      availabilityMap.set(avail.day_of_week, existing);
    });

    // 13. Create breaks map by day of week
    const breaksMap = new Map<number, { start_time: string; end_time: string }[]>();
    (breaks || []).forEach((brk) => {
      const existing = breaksMap.get(brk.day_of_week) || [];
      existing.push({ start_time: brk.start_time, end_time: brk.end_time });
      breaksMap.set(brk.day_of_week, existing);
    });

    // 14. Create appointments map by date
    const appointmentsMap = new Map<string, { start_time: string; end_time: string }[]>();
    (appointments || []).forEach((apt) => {
      const dateKey = apt.appointment_date;
      const existing = appointmentsMap.get(dateKey) || [];
      existing.push({ start_time: apt.start_time, end_time: apt.end_time });
      appointmentsMap.set(dateKey, existing);
    });

    // 15. Generate slots for each day in range
    const dailySlots: DailySlots[] = [];
    const allSlots: AvailableSlot[] = [];
    const currentDate = new Date(baseDate);

    while (currentDate <= endDate) {
      const dateStr = formatDateYMD(currentDate);
      const dayOfWeek = currentDate.getDay();
      const dayAvailability = availabilityMap.get(dayOfWeek);

      if (dayAvailability && dayAvailability.length > 0) {
        const dayBreaks = breaksMap.get(dayOfWeek) || [];
        const dayAppointments = appointmentsMap.get(dateStr) || [];

        const slots = generateTimeSlotsForDay(
          dateStr,
          dayOfWeek,
          dayAvailability,
          dayBreaks,
          dayAppointments,
          duration_minutes,
          max_per_day,
          currentDate.toDateString() === new Date().toDateString()
        );

        if (slots.length > 0) {
          dailySlots.push({
            date: dateStr,
            day_of_week: dayOfWeek,
            day_name: DAY_NAMES_ES[dayOfWeek],
            slot_count: slots.length,
            slots,
          });
          allSlots.push(...slots);
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 16. Get next 5 available slots for quick access
    const nextAvailable = allSlots.slice(0, 5).map((slot, index) => ({
      ...slot,
      is_preferred: index === 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        doctor_id: doctorId,
        doctor_name: doctorProfile.full_name || undefined,
        tenant_id: targetTenantId,
        date_range: {
          start: formatDateYMD(baseDate),
          end: formatDateYMD(endDate),
        },
        duration_minutes,
        total_slots: allSlots.length,
        days: dailySlots,
        next_available: nextAvailable,
      },
    });
  } catch (error) {
    console.error('[available-slots] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate time slots for a specific day
 */
function generateTimeSlotsForDay(
  date: string,
  dayOfWeek: number,
  availability: { start_time: string; end_time: string }[],
  breaks: { start_time: string; end_time: string }[],
  appointments: { start_time: string; end_time: string }[],
  durationMinutes: number,
  maxSlots: number,
  isToday: boolean
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const now = new Date();
  const currentTimeMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0;

  for (const period of availability) {
    const startMinutes = timeToMinutes(period.start_time);
    const endMinutes = timeToMinutes(period.end_time);

    let slotStart = startMinutes;

    // If today, skip past slots
    if (isToday && slotStart < currentTimeMinutes + 30) {
      // Add 30 min buffer
      slotStart = Math.ceil((currentTimeMinutes + 30) / durationMinutes) * durationMinutes;
    }

    while (slotStart + durationMinutes <= endMinutes) {
      if (slots.length >= maxSlots) break;

      const slotEnd = slotStart + durationMinutes;
      const slotStartTime = minutesToTime(slotStart);
      const slotEndTime = minutesToTime(slotEnd);

      // Check if slot conflicts with breaks
      const conflictsWithBreak = breaks.some((brk) => {
        const breakStart = timeToMinutes(brk.start_time);
        const breakEnd = timeToMinutes(brk.end_time);
        return slotStart < breakEnd && slotEnd > breakStart;
      });

      // Check if slot conflicts with appointments
      const conflictsWithAppointment = appointments.some((apt) => {
        const aptStart = timeToMinutes(apt.start_time);
        const aptEnd = timeToMinutes(apt.end_time);
        return slotStart < aptEnd && slotEnd > aptStart;
      });

      if (!conflictsWithBreak && !conflictsWithAppointment) {
        slots.push({
          date,
          day_of_week: dayOfWeek,
          day_name: DAY_NAMES_ES[dayOfWeek],
          start_time: slotStartTime,
          end_time: slotEndTime,
        });
      }

      slotStart += durationMinutes;
    }

    if (slots.length >= maxSlots) break;
  }

  return slots;
}

/**
 * Convert time string (HH:MM or HH:MM:SS) to minutes
 */
function timeToMinutes(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Convert minutes to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
