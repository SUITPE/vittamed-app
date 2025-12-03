/**
 * API Route: POST /api/appointments/[appointmentId]/reschedule
 * Ticket: VT-183 - API: Reschedule Appointment
 *
 * Reschedules an existing appointment to a new date/time.
 * Creates a new appointment and cancels the original.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-server';
import { customAuth } from '@/lib/custom-auth';
import type { RescheduleAppointmentResponse } from '@/types/reschedule';
import {
  checkRescheduleEligibility,
  DEFAULT_RESCHEDULE_POLICY,
} from '@/types/reschedule';

// Validation schema
const RescheduleRequestSchema = z.object({
  new_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  new_start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS format'),
  new_end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS format').optional(),
  new_doctor_id: z.string().uuid().optional(),
  new_member_id: z.string().uuid().optional(),
  new_assigned_member_id: z.string().uuid().optional(),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  notes: z.string().optional(),
  send_notification: z.boolean().optional().default(true),
  notification_channels: z.array(z.enum(['email', 'sms', 'whatsapp'])).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params;
  console.log('[POST /reschedule] START - appointmentId:', appointmentId);

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
    const parseResult = RescheduleRequestSchema.safeParse(body);

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
      console.error('[Reschedule] Appointment not found:', fetchError);
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

    const canReschedule = (isAdminOrStaff || isOwnDoctor || isOwnMember) && isSameTenant;

    if (!canReschedule) {
      return NextResponse.json(
        { error: 'You do not have permission to reschedule this appointment' },
        { status: 403 }
      );
    }

    // 5. Check reschedule eligibility
    const eligibility = checkRescheduleEligibility(originalAppointment, DEFAULT_RESCHEDULE_POLICY);
    if (!eligibility.can_reschedule) {
      return NextResponse.json(
        {
          error: 'Cannot reschedule appointment',
          reasons: eligibility.reasons,
        },
        { status: 400 }
      );
    }

    // 6. Calculate end time if not provided
    const service = Array.isArray(originalAppointment.services)
      ? originalAppointment.services[0]
      : originalAppointment.services;

    let newEndTime = validatedData.new_end_time;
    if (!newEndTime && service?.duration_minutes) {
      const [hours, minutes] = validatedData.new_start_time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + service.duration_minutes;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      newEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;
    } else if (!newEndTime) {
      newEndTime = originalAppointment.end_time;
    }

    // 7. Check availability for the new time slot
    const { data: conflictingAppointments, error: conflictError } = await supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', originalAppointment.tenant_id)
      .eq('appointment_date', validatedData.new_date)
      .neq('id', appointmentId)
      .in('status', ['pending', 'confirmed'])
      .or(`doctor_id.eq.${validatedData.new_doctor_id || originalAppointment.doctor_id},assigned_member_id.eq.${validatedData.new_assigned_member_id || originalAppointment.assigned_member_id}`)
      .gte('end_time', validatedData.new_start_time)
      .lte('start_time', newEndTime);

    if (conflictError) {
      console.error('[Reschedule] Conflict check error:', conflictError);
    }

    if (conflictingAppointments && conflictingAppointments.length > 0) {
      return NextResponse.json(
        { error: 'The selected time slot is not available' },
        { status: 409 }
      );
    }

    // 8. Use admin client for database operations (bypasses RLS)
    const adminClient = await createAdminClient();

    // 9. Create new appointment
    const originalId = originalAppointment.original_appointment_id || originalAppointment.id;
    const rescheduleCount = (originalAppointment.reschedule_count || 0) + 1;

    const newAppointmentData = {
      tenant_id: originalAppointment.tenant_id,
      patient_id: originalAppointment.patient_id,
      service_id: originalAppointment.service_id,
      doctor_id: validatedData.new_doctor_id || originalAppointment.doctor_id,
      member_id: originalAppointment.member_id,
      assigned_member_id: validatedData.new_assigned_member_id || originalAppointment.assigned_member_id,
      appointment_date: validatedData.new_date,
      start_time: validatedData.new_start_time,
      end_time: newEndTime,
      status: 'pending',
      notes: validatedData.notes || originalAppointment.notes,
      total_amount: originalAppointment.total_amount,
      // Reschedule tracking fields
      original_appointment_id: originalId,
      rescheduled_from_id: originalAppointment.id,
      rescheduled_at: new Date().toISOString(),
      rescheduled_by: user.id,
      reschedule_reason: validatedData.reason,
      reschedule_count: rescheduleCount,
      is_rebook: false,
      // Series fields (if applicable)
      series_id: originalAppointment.series_id,
      series_occurrence: originalAppointment.series_occurrence,
    };

    const { data: newAppointment, error: createError } = await adminClient
      .from('appointments')
      .insert(newAppointmentData)
      .select()
      .single();

    if (createError) {
      console.error('[Reschedule] Create error:', createError);
      return NextResponse.json(
        { error: 'Failed to create new appointment' },
        { status: 500 }
      );
    }

    // 10. Cancel the original appointment
    const { error: cancelError } = await adminClient
      .from('appointments')
      .update({
        status: 'cancelled',
        notes: `${originalAppointment.notes || ''}\n[Reprogramada: ${validatedData.reason}]`.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    if (cancelError) {
      console.error('[Reschedule] Cancel error:', cancelError);
      // Rollback: delete the new appointment
      await adminClient.from('appointments').delete().eq('id', newAppointment.id);
      return NextResponse.json(
        { error: 'Failed to cancel original appointment' },
        { status: 500 }
      );
    }

    // 11. TODO: Send notifications if requested
    // This would integrate with the notification system

    const response: RescheduleAppointmentResponse = {
      success: true,
      new_appointment: newAppointment,
      original_appointment: { ...originalAppointment, status: 'cancelled' },
      reschedule_count: rescheduleCount,
      message: 'Appointment rescheduled successfully',
      notification_sent: false, // TODO: implement notification
    };

    console.log('[Reschedule] SUCCESS - new appointment:', newAppointment.id);
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[Reschedule] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/appointments/[appointmentId]/reschedule
 * Check if an appointment can be rescheduled
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
      .select('*')
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

    const eligibility = checkRescheduleEligibility(appointment, DEFAULT_RESCHEDULE_POLICY);

    return NextResponse.json({
      appointment_id: appointmentId,
      ...eligibility,
      policy: {
        max_reschedules: DEFAULT_RESCHEDULE_POLICY.max_reschedules_per_appointment,
        min_hours_before: DEFAULT_RESCHEDULE_POLICY.min_hours_before_appointment,
        allowed_statuses: DEFAULT_RESCHEDULE_POLICY.allowed_source_statuses,
      },
    });

  } catch (error) {
    console.error('[GET /reschedule] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
