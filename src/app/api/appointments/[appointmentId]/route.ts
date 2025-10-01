import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params
  console.log('[PATCH Appointment] START - appointmentId:', appointmentId)

  try {
    const supabase = await createClient()
    const body = await request.json()
    console.log('[PATCH Appointment] Body:', body)

    // Get current user and check permissions
    const user = await customAuth.getCurrentUser()
    console.log('[PATCH Appointment] User:', user ? { id: user.id, email: user.email, role: user.profile?.role } : null)

    if (!user || !user.profile) {
      console.log('[PATCH Appointment] No user or profile - returning 401')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Use the profile data from customAuth instead of querying again
    const userAccess = {
      role: user.profile.role,
      tenant_id: user.profile.tenant_id
    }

    console.log('[PATCH Appointment] User access:', userAccess)

    // Get the appointment to verify tenant access
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('tenant_id, doctor_id')
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Check authorization - admin/receptionist/staff can manage any appointment in their tenant,
    // doctor can manage their own appointments
    const isAdminOrStaff = userAccess.role === 'admin_tenant' ||
                           userAccess.role === 'receptionist' ||
                           userAccess.role === 'staff'
    const isOwnDoctor = userAccess.role === 'doctor' && appointment.doctor_id === user.id
    const isSameTenant = userAccess.tenant_id === appointment.tenant_id

    const canManageAppointment = (isAdminOrStaff || isOwnDoctor) && isSameTenant

    if (!canManageAppointment) {
      console.error('[PATCH Appointment] Permission denied:', {
        userId: user.id,
        userRole: userAccess.role,
        userTenantId: userAccess.tenant_id,
        appointmentTenantId: appointment.tenant_id,
        appointmentDoctorId: appointment.doctor_id,
        isAdminOrStaff,
        isOwnDoctor,
        isSameTenant
      })
      return NextResponse.json({
        error: 'You can only manage appointments in your tenant'
      }, { status: 403 })
    }

    // Validate status if provided
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({
        error: 'Invalid status. Must be one of: pending, confirmed, completed, cancelled'
      }, { status: 400 })
    }

    // Update the appointment
    const updateData: Record<string, unknown> = {}
    if (body.status) updateData.status = body.status
    if (body.start_time) updateData.start_time = body.start_time
    if (body.end_time) updateData.end_time = body.end_time
    if (body.notes) updateData.notes = body.notes
    if (body.doctor_id) updateData.doctor_id = body.doctor_id
    if (body.appointment_date) updateData.appointment_date = body.appointment_date

    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        doctor_id,
        patient_id,
        service_id
      `)
      .single()

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params
  try {
    const supabase = await createClient()

    // Get current user and check permissions
    const user = await customAuth.getCurrentUser()

    if (!user || !user.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get the appointment with full details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_name,
        patient_email,
        patient_phone,
        start_time,
        end_time,
        status,
        notes,
        tenant_id,
        doctor_id,
        service_id,
        services (
          name,
          duration_minutes,
          price
        ),
        doctors (
          first_name,
          last_name,
          specialty
        )
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Use the profile data from customAuth instead of querying again
    const userAccess = {
      role: user.profile.role,
      tenant_id: user.profile.tenant_id
    }

    const canViewAppointment = userAccess.role === 'admin_tenant' ||
                              userAccess.role === 'receptionist' ||
                              userAccess.role === 'staff' ||
                              (userAccess.role === 'doctor' && appointment.doctor_id === user.id) ||
                              (userAccess.role === 'patient' && appointment.patient_email === user.email)

    if (!canViewAppointment) {
      return NextResponse.json({
        error: 'You do not have permission to view this appointment'
      }, { status: 403 })
    }

    return NextResponse.json({ appointment })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}