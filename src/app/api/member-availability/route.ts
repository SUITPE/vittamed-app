import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import type {
  MemberAvailability,
  CreateMemberAvailabilityData,
  MemberAvailabilityFilters
} from '@/types/catalog'

// Get member availability with filters and pagination
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
    const limit = parseInt(searchParams.get('limit') || '10')
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
      .from('user_profiles')
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
      .from('member_availability')
      .select(`
        id,
        member_user_id,
        tenant_id,
        day_of_week,
        start_time,
        end_time,
        is_active,
        created_at,
        updated_at,
        user_profiles!member_availability_member_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)

    // Apply filters based on user role
    if (profile.role === 'member') {
      // Members can only see their own availability
      query = query.eq('member_user_id', user.id)
    } else if (['admin_tenant', 'receptionist'].includes(profile.role)) {
      // Admins and receptionists can see availability in their tenant
      query = query.eq('tenant_id', profile.tenant_id)
    } else if (profile.role === 'doctor') {
      // Doctors can view member availability in their tenant (for reference)
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
    const { data: availability, error, count } = await query
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching member availability:', error)
      return NextResponse.json(
        { error: 'Failed to fetch member availability' },
        { status: 500 }
      )
    }

    // Format response
    const response = {
      availability: availability?.map(a => ({
        ...a,
        member: a.user_profiles
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
    console.error('Error in member availability API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create new member availability
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const data: CreateMemberAvailabilityData = await request.json()

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
      .from('user_profiles')
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
      .from('user_profiles')
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

    // Check for conflicting availability (overlapping time periods on the same day)
    const { data: conflicts, error: conflictError } = await supabase
      .from('member_availability')
      .select('id, start_time, end_time')
      .eq('member_user_id', member_user_id)
      .eq('tenant_id', tenant_id)
      .eq('day_of_week', day_of_week)
      .eq('is_active', true)

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json(
        { error: 'Failed to validate availability conflicts' },
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
        { error: 'Time period conflicts with existing availability' },
        { status: 409 }
      )
    }

    // Create the availability record
    const { data: availability, error: createError } = await supabase
      .from('member_availability')
      .insert({
        member_user_id,
        tenant_id,
        day_of_week,
        start_time,
        end_time,
        is_active: data.is_active !== undefined ? data.is_active : true
      })
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

    if (createError || !availability) {
      console.error('Error creating member availability:', createError)
      return NextResponse.json(
        { error: 'Failed to create member availability' },
        { status: 500 }
      )
    }

    // Format response
    const response = {
      ...availability,
      member: availability.user_profiles
    }
    delete response.user_profiles

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error in member availability creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}