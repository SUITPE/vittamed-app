import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import type { UpdateMemberAvailabilityData } from '@/types/catalog'

// Get specific member availability
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Availability ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get availability with member information
    const { data: availability, error } = await supabase
      .from('member_availability')
      .select(`
        *,
        user_profiles!member_availability_member_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('id', id)
      .single()

    if (error || !availability) {
      return NextResponse.json(
        { error: 'Member availability not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    const canAccess =
      (profile?.role === 'member' && user.id === availability.member_user_id) ||
      (['admin_tenant', 'receptionist'].includes(profile?.role || '') && profile?.tenant_id === availability.tenant_id) ||
      (profile?.role === 'doctor' && profile?.tenant_id === availability.tenant_id)

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Format response
    const response = {
      ...availability,
      member: availability.user_profiles
    }
    delete response.user_profiles

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching member availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update member availability
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { id } = params
    const data: UpdateMemberAvailabilityData = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Availability ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get existing availability
    const { data: existing, error: fetchError } = await supabase
      .from('member_availability')
      .select('member_user_id, tenant_id, day_of_week, start_time, end_time')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Member availability not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    const canUpdate =
      (profile?.role === 'member' && user.id === existing.member_user_id) ||
      (['admin_tenant', 'receptionist'].includes(profile?.role || '') && profile?.tenant_id === existing.tenant_id)

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate updates
    const updates: Partial<UpdateMemberAvailabilityData & { updated_at: string }> = {}

    if (data.day_of_week !== undefined) {
      if (data.day_of_week < 0 || data.day_of_week > 6) {
        return NextResponse.json(
          { error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' },
          { status: 400 }
        )
      }
      updates.day_of_week = data.day_of_week
    }

    if (data.start_time !== undefined || data.end_time !== undefined) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/

      if (data.start_time !== undefined) {
        if (!timeRegex.test(data.start_time)) {
          return NextResponse.json(
            { error: 'start_time must be in HH:MM format' },
            { status: 400 }
          )
        }
        updates.start_time = data.start_time
      }

      if (data.end_time !== undefined) {
        if (!timeRegex.test(data.end_time)) {
          return NextResponse.json(
            { error: 'end_time must be in HH:MM format' },
            { status: 400 }
          )
        }
        updates.end_time = data.end_time
      }

      // Validate time order
      const finalStartTime = updates.start_time || existing.start_time
      const finalEndTime = updates.end_time || existing.end_time

      if (finalStartTime >= finalEndTime) {
        return NextResponse.json(
          { error: 'start_time must be earlier than end_time' },
          { status: 400 }
        )
      }
    }

    if (data.is_active !== undefined) {
      updates.is_active = data.is_active
    }

    // Check for conflicts if day or times are changing
    if (updates.day_of_week !== undefined || updates.start_time !== undefined || updates.end_time !== undefined) {
      const checkDay = updates.day_of_week !== undefined ? updates.day_of_week : existing.day_of_week
      const checkStartTime = updates.start_time || existing.start_time
      const checkEndTime = updates.end_time || existing.end_time

      const { data: conflicts, error: conflictError } = await supabase
        .from('member_availability')
        .select('id, start_time, end_time')
        .eq('member_user_id', existing.member_user_id)
        .eq('tenant_id', existing.tenant_id)
        .eq('day_of_week', checkDay)
        .eq('is_active', true)
        .neq('id', id) // Exclude current record

      if (conflictError) {
        console.error('Error checking conflicts:', conflictError)
        return NextResponse.json(
          { error: 'Failed to validate availability conflicts' },
          { status: 500 }
        )
      }

      const hasConflict = conflicts?.some(otherAvailability => {
        return (
          (checkStartTime >= otherAvailability.start_time && checkStartTime < otherAvailability.end_time) ||
          (checkEndTime > otherAvailability.start_time && checkEndTime <= otherAvailability.end_time) ||
          (checkStartTime <= otherAvailability.start_time && checkEndTime >= otherAvailability.end_time)
        )
      })

      if (hasConflict) {
        return NextResponse.json(
          { error: 'Time period conflicts with existing availability' },
          { status: 409 }
        )
      }
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    // Perform the update
    const { data: updated, error: updateError } = await supabase
      .from('member_availability')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        user_profiles!member_availability_member_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .single()

    if (updateError || !updated) {
      console.error('Error updating member availability:', updateError)
      return NextResponse.json(
        { error: 'Failed to update member availability' },
        { status: 500 }
      )
    }

    // Format response
    const response = {
      ...updated,
      member: updated.user_profiles
    }
    delete response.user_profiles

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error updating member availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete member availability
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Availability ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get existing availability to check permissions
    const { data: existing, error: fetchError } = await supabase
      .from('member_availability')
      .select('member_user_id, tenant_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Member availability not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    const canDelete =
      (profile?.role === 'member' && user.id === existing.member_user_id) ||
      (['admin_tenant', 'receptionist'].includes(profile?.role || '') && profile?.tenant_id === existing.tenant_id)

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Check if there are future appointments that depend on this availability
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { data: futureAppointments, error: appointmentError } = await supabase
      .from('appointments')
      .select('id')
      .eq('assigned_member_id', existing.member_user_id)
      .gte('appointment_date', tomorrowStr)
      .not('status', 'in', '("cancelled", "completed")')
      .limit(1)

    if (appointmentError) {
      console.error('Error checking future appointments:', appointmentError)
      return NextResponse.json(
        { error: 'Failed to validate future appointments' },
        { status: 500 }
      )
    }

    if (futureAppointments && futureAppointments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete availability with future appointments. Please reschedule or cancel appointments first.' },
        { status: 409 }
      )
    }

    // Delete the availability
    const { error: deleteError } = await supabase
      .from('member_availability')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting member availability:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete member availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting member availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}