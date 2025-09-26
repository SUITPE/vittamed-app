import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params
  try {
    const supabase = await createClient()
    const body = await request.json()

    // Get current user and check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has permissions (admin, receptionist, or doctor)
    const { data: userAccess, error: accessError } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (accessError || !userAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the appointment to verify tenant access
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('tenant_id, doctor_id')
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Check authorization - admin/receptionist can manage any appointment in their tenant,
    // doctor can manage their own appointments
    const canManageAppointment = userAccess.role === 'admin_tenant' ||
                                userAccess.role === 'receptionist' ||
                                (userAccess.role === 'doctor' && appointment.doctor_id === user.id)

    if (!canManageAppointment) {
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
    const updateData: any = {}
    if (body.status) updateData.status = body.status
    if (body.patient_name) updateData.patient_name = body.patient_name
    if (body.start_time) updateData.start_time = body.start_time
    if (body.end_time) updateData.end_time = body.end_time
    if (body.notes) updateData.notes = body.notes

    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select(`
        id,
        patient_name,
        start_time,
        end_time,
        status,
        notes,
        services (name),
        doctors (first_name, last_name)
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
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
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

    // Check if user has access to this appointment
    const { data: userAccess, error: accessError } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (accessError || !userAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const canViewAppointment = userAccess.role === 'admin_tenant' ||
                              userAccess.role === 'receptionist' ||
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