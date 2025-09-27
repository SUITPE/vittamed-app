import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { StatusTransitionData, AppointmentStatus } from '@/types/catalog'

// VT-38: Appointment status management API
// Handles status transitions with validation and audit trail

// Status transition rules - defines allowed transitions and requirements
const STATUS_TRANSITION_RULES = {
  'pending': {
    allowed_next: ['confirmed', 'cancelled'] as AppointmentStatus[],
    required_roles: ['admin_tenant', 'receptionist', 'doctor', 'member']
  },
  'confirmed': {
    allowed_next: ['completed', 'cancelled', 'no_show'] as AppointmentStatus[],
    required_roles: ['admin_tenant', 'receptionist', 'doctor', 'member']
  },
  'cancelled': {
    allowed_next: [] as AppointmentStatus[], // Terminal state
    required_roles: ['admin_tenant', 'receptionist', 'doctor', 'member']
  },
  'completed': {
    allowed_next: [] as AppointmentStatus[], // Terminal state
    required_roles: ['admin_tenant', 'receptionist', 'doctor', 'member']
  },
  'no_show': {
    allowed_next: [] as AppointmentStatus[], // Terminal state
    required_roles: ['admin_tenant', 'receptionist', 'doctor', 'member']
  }
} as const

// Update appointment status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params
    const body: StatusTransitionData = await request.json()
    const { new_status, reason, notes, automated = false, change_source = 'api' } = body

    if (!new_status) {
      return NextResponse.json(
        { error: 'new_status is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user profile for authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get current appointment to validate status transition
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('tenant_id', userProfile.tenant_id) // Ensure user can only modify appointments in their tenant
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const currentStatus = appointment.status as AppointmentStatus

    // Validate status transition
    const transitionRules = STATUS_TRANSITION_RULES[currentStatus]

    // Check if transition is allowed
    if (!transitionRules.allowed_next.includes(new_status)) {
      return NextResponse.json(
        {
          error: `Status transition from '${currentStatus}' to '${new_status}' is not allowed`,
          allowed_transitions: transitionRules.allowed_next,
          current_status: currentStatus
        },
        { status: 400 }
      )
    }

    // Check if user has required role
    if (!transitionRules.required_roles.includes(userProfile.role)) {
      return NextResponse.json(
        {
          error: `Role '${userProfile.role}' is not authorized to change appointment status`,
          required_roles: transitionRules.required_roles
        },
        { status: 403 }
      )
    }

    // Check if the status is already the requested status
    if (currentStatus === new_status) {
      return NextResponse.json(
        {
          error: `Appointment is already in '${new_status}' status`,
          current_status: currentStatus
        },
        { status: 400 }
      )
    }

    // Update appointment status
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        status: new_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .eq('tenant_id', userProfile.tenant_id)
      .select(`
        *,
        doctor:doctors(id, first_name, last_name, email),
        patient:patients(id, first_name, last_name, email, phone),
        service:services(id, name, description, duration_minutes, price)
      `)
      .single()

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update appointment status' },
        { status: 500 }
      )
    }

    // The status change will be automatically logged by the database trigger
    // But we can also manually create a more detailed history entry if needed
    if (reason || notes) {
      const { error: historyError } = await supabase
        .from('appointment_status_history')
        .insert({
          appointment_id: appointmentId,
          tenant_id: userProfile.tenant_id,
          status: new_status,
          previous_status: currentStatus,
          changed_by_user_id: user.id,
          changed_by_role: userProfile.role,
          reason,
          notes,
          automated,
          change_source
        })

      if (historyError) {
        console.error('Error creating detailed status history:', historyError)
        // Don't fail the request, the trigger should have created basic history
      }
    }

    // Get status history for the response
    const { data: statusHistory } = await supabase
      .from('appointment_status_history')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false })
      .limit(5) // Last 5 status changes

    const response = {
      success: true,
      appointment: updatedAppointment,
      status_change: {
        from: currentStatus,
        to: new_status,
        changed_at: new Date().toISOString(),
        changed_by: {
          id: user.id,
          role: userProfile.role
        },
        reason,
        notes
      },
      recent_history: statusHistory,
      message: `Appointment status updated from '${currentStatus}' to '${new_status}' successfully`
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in appointment status update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get appointment status history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params
    const supabase = await createClient()

    // Get current user profile for authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get appointment to verify access
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, status, tenant_id')
      .eq('id', appointmentId)
      .eq('tenant_id', userProfile.tenant_id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Get full status history using the view
    const { data: statusHistory, error: historyError } = await supabase
      .from('appointment_lifecycle_view')
      .select('*')
      .eq('appointment_id', appointmentId)
      .eq('tenant_id', userProfile.tenant_id)
      .order('status_changed_at', { ascending: false })

    if (historyError) {
      console.error('Error fetching status history:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch status history' },
        { status: 500 }
      )
    }

    const response = {
      appointment: {
        id: appointment.id,
        current_status: appointment.status,
        tenant_id: appointment.tenant_id
      },
      status_history: statusHistory || [],
      total_changes: statusHistory?.length || 0,
      available_transitions: STATUS_TRANSITION_RULES[appointment.status as AppointmentStatus]?.allowed_next || []
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error fetching appointment status history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}