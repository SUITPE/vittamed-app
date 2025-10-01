import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { UpdateMemberBookingSettingsData, MemberBookingSettingsUpdateResponse } from '@/types/catalog'

// VT-40: Member booking settings management API
// Allows admin tenants to control whether members can receive bookings

// Update member booking settings
export async function PUT(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const memberId = params.memberId
    const body: UpdateMemberBookingSettingsData = await request.json()
    const { allow_bookings, reason, notes } = body

    if (typeof allow_bookings !== 'boolean') {
      return NextResponse.json(
        { error: 'allow_bookings must be a boolean value' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get current user profile for authorization
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userRole = user.profile?.role
    const userTenantId = user.profile?.tenant_id

    if (!userRole) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Only admin tenants can modify booking settings
    if (userRole !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Only admin tenants can modify member booking settings' },
        { status: 403 }
      )
    }

    // Get current member to verify it exists and is in the same tenant
    const { data: currentMember, error: memberError } = await supabase
      .from('user_profiles')
      .select('id, tenant_id, role, first_name, last_name, email, allow_bookings, is_active')
      .eq('id', memberId)
      .eq('tenant_id', userTenantId)
      .eq('role', 'member')
      .single()

    if (memberError || !currentMember) {
      return NextResponse.json(
        { error: 'Member not found in your tenant or is not a member' },
        { status: 404 }
      )
    }

    // Check if the setting is already the requested value
    if (currentMember.allow_bookings === allow_bookings) {
      return NextResponse.json(
        {
          error: `Member booking settings are already set to allow_bookings=${allow_bookings}`,
          current_setting: currentMember.allow_bookings
        },
        { status: 400 }
      )
    }

    const previousSetting = currentMember.allow_bookings

    // Update member booking settings
    const { data: updatedMember, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        allow_bookings,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .eq('tenant_id', userTenantId)
      .eq('role', 'member')
      .select(`
        id,
        tenant_id,
        first_name,
        last_name,
        email,
        role,
        is_active,
        allow_bookings,
        created_at,
        updated_at
      `)
      .single()

    if (updateError) {
      console.error('Error updating member booking settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update member booking settings' },
        { status: 500 }
      )
    }

    // Log the change for audit purposes (optional - could be in separate audit table)
    if (reason || notes) {
      console.log('Member booking settings changed:', {
        member_id: memberId,
        tenant_id: userTenantId,
        previous_setting: previousSetting,
        new_setting: allow_bookings,
        changed_by: user.id,
        changed_by_role: userRole,
        reason,
        notes,
        timestamp: new Date().toISOString()
      })
    }

    const response: MemberBookingSettingsUpdateResponse = {
      success: true,
      member: updatedMember,
      previous_setting: previousSetting,
      new_setting: allow_bookings,
      updated_by: {
        id: user.id,
        role: userRole
      },
      updated_at: updatedMember.updated_at,
      message: `Member booking settings updated successfully. Member ${allow_bookings ? 'can now' : 'cannot'} receive bookings.`
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in member booking settings update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get member booking settings
export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const memberId = params.memberId
    const supabase = await createClient()

    // Get current user profile for authorization
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userRole = user.profile?.role
    const userTenantId = user.profile?.tenant_id

    if (!userRole) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Get member with booking settings (uses the view we created)
    const { data: memberSettings, error: memberError } = await supabase
      .from('member_booking_settings')
      .select('*')
      .eq('member_user_id', memberId)
      .eq('tenant_id', userTenantId)
      .single()

    if (memberError || !memberSettings) {
      return NextResponse.json(
        { error: 'Member not found in your tenant' },
        { status: 404 }
      )
    }

    // Additional context: check if member has any upcoming appointments
    // This helps admins understand the impact of disabling bookings
    const { data: upcomingAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, appointment_date, start_time, status')
      .eq('assigned_member_id', memberId)
      .eq('tenant_id', userTenantId)
      .gte('appointment_date', new Date().toISOString().split('T')[0])
      .in('status', ['pending', 'confirmed'])
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(5)

    const response = {
      member: memberSettings,
      booking_status: {
        allows_bookings: memberSettings.allow_bookings,
        has_assigned_services: memberSettings.assigned_services_count > 0,
        has_availability_setup: memberSettings.availability_entries_count > 0,
        is_ready_for_bookings: memberSettings.allow_bookings &&
                               memberSettings.assigned_services_count > 0 &&
                               memberSettings.availability_entries_count > 0
      },
      upcoming_appointments: appointmentsError ? [] : (upcomingAppointments || []),
      upcoming_appointments_count: appointmentsError ? 0 : (upcomingAppointments || []).length
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error fetching member booking settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}