import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import type { CreateMemberBreakData, MemberBreak } from '@/types/catalog'

// Get member breaks with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    // Extract query parameters
    const member_user_id = searchParams.get('member_user_id')
    const tenant_id = searchParams.get('tenant_id')
    const day_of_week = searchParams.get('day_of_week')
    const is_active = searchParams.get('is_active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Verify user authentication
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('custom_users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'User not associated with any tenant' },
        { status: 403 }
      )
    }

    // Build query with filters
    let query = supabase
      .from('member_breaks')
      .select(`
        id,
        member_user_id,
        tenant_id,
        day_of_week,
        start_time,
        end_time,
        break_type,
        description,
        is_active,
        created_at,
        updated_at,
        custom_users!member_breaks_member_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)

    // Apply filters based on user role
    if (profile.role === 'member') {
      // Members can only see their own breaks
      query = query.eq('member_user_id', user.id)
    } else if (['admin_tenant', 'receptionist'].includes(profile.role)) {
      // Admins and receptionists can see breaks in their tenant
      query = query.eq('tenant_id', profile.tenant_id)
    } else if (profile.role === 'doctor') {
      // Doctors can view member breaks in their tenant (for reference)
      query = query.eq('tenant_id', profile.tenant_id)
    }

    // Apply additional filters
    if (member_user_id) {
      query = query.eq('member_user_id', member_user_id)
    }
    if (tenant_id && ['admin_tenant'].includes(profile.role)) {
      query = query.eq('tenant_id', tenant_id)
    }
    if (day_of_week !== null && day_of_week !== undefined) {
      query = query.eq('day_of_week', parseInt(day_of_week))
    }
    if (is_active !== null && is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true')
    }

    // Apply ordering and pagination
    const { data: breaks, error, count } = await query
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching member breaks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch member breaks' },
        { status: 500 }
      )
    }

    // Format response
    const response = {
      breaks: breaks?.map(b => ({
        ...b,
        member: b.custom_users
      })) || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in member breaks API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create new member break
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const data: CreateMemberBreakData = await request.json()

    // Validate required fields
    const { member_user_id, tenant_id, day_of_week, start_time, end_time } = data

    if (!member_user_id || !tenant_id || day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required fields: member_user_id, tenant_id, day_of_week, start_time, end_time' },
        { status: 400 }
      )
    }

    // Validate day_of_week range
    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json(
        { error: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return NextResponse.json(
        { error: 'Time must be in HH:MM format' },
        { status: 400 }
      )
    }

    // Validate start_time < end_time
    if (start_time >= end_time) {
      return NextResponse.json(
        { error: 'start_time must be earlier than end_time' },
        { status: 400 }
      )
    }

    // Validate break_type
    if (data.break_type && !['lunch', 'break', 'other'].includes(data.break_type)) {
      return NextResponse.json(
        { error: 'break_type must be one of: lunch, break, other' },
        { status: 400 }
      )
    }

    // Verify user authentication and permissions
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('custom_users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    // Check permissions
    const canCreate =
      (profile?.role === 'member' && user.id === member_user_id) ||
      (['admin_tenant', 'receptionist'].includes(profile?.role || '') && profile?.tenant_id === tenant_id)

    if (!canCreate) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Verify the member exists and belongs to the tenant
    const { data: memberExists, error: memberError } = await supabase
      .from('custom_users')
      .select('id, role, tenant_id')
      .eq('id', member_user_id)
      .eq('role', 'member')
      .eq('tenant_id', tenant_id)
      .single()

    if (memberError || !memberExists) {
      return NextResponse.json(
        { error: 'Member not found or not associated with this tenant' },
        { status: 400 }
      )
    }

    // Validate that the break falls within member's availability windows
    const { data: availability, error: availabilityError } = await supabase
      .from('member_availability')
      .select('start_time, end_time')
      .eq('member_user_id', member_user_id)
      .eq('tenant_id', tenant_id)
      .eq('day_of_week', day_of_week)
      .eq('is_active', true)

    if (availabilityError) {
      console.error('Error checking availability:', availabilityError)
      return NextResponse.json(
        { error: 'Failed to validate break against availability' },
        { status: 500 }
      )
    }

    if (!availability || availability.length === 0) {
      return NextResponse.json(
        { error: 'Member has no availability on this day. Please set availability first.' },
        { status: 400 }
      )
    }

    // Check if break falls within any availability period
    const isWithinAvailability = availability.some(avail => {
      return start_time >= avail.start_time && end_time <= avail.end_time
    })

    if (!isWithinAvailability) {
      return NextResponse.json(
        { error: 'Break must fall within member\'s availability hours' },
        { status: 400 }
      )
    }

    // Check for conflicting breaks (overlapping time periods on the same day)
    const { data: conflicts, error: conflictError } = await supabase
      .from('member_breaks')
      .select('id, start_time, end_time')
      .eq('member_user_id', member_user_id)
      .eq('tenant_id', tenant_id)
      .eq('day_of_week', day_of_week)
      .eq('is_active', true)

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json(
        { error: 'Failed to validate break conflicts' },
        { status: 500 }
      )
    }

    // Check for time overlap
    const hasConflict = conflicts?.some(existing => {
      return (
        (start_time >= existing.start_time && start_time < existing.end_time) ||
        (end_time > existing.start_time && end_time <= existing.end_time) ||
        (start_time <= existing.start_time && end_time >= existing.end_time)
      )
    })

    if (hasConflict) {
      return NextResponse.json(
        { error: 'Time period conflicts with existing break' },
        { status: 409 }
      )
    }

    // Create the break record
    const { data: memberBreak, error: createError } = await supabase
      .from('member_breaks')
      .insert({
        member_user_id,
        tenant_id,
        day_of_week,
        start_time,
        end_time,
        break_type: data.break_type || 'break',
        description: data.description,
        is_active: data.is_active !== undefined ? data.is_active : true
      })
      .select(`
        *,
        custom_users!member_breaks_member_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .single()

    if (createError || !memberBreak) {
      console.error('Error creating member break:', createError)
      return NextResponse.json(
        { error: 'Failed to create member break' },
        { status: 500 }
      )
    }

    // Format response
    const response = {
      ...memberBreak,
      member: memberBreak.custom_users
    }
    delete response.custom_users

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error in member break creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}