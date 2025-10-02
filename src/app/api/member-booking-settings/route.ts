import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

// VT-40: Member booking settings management API
// Provides overview of all members and their booking availability

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const allowBookings = searchParams.get('allow_bookings') // 'true', 'false', or null for all
    const isActive = searchParams.get('is_active') // 'true', 'false', or null for all
    const hasServices = searchParams.get('has_services') // 'true' to filter members with assigned services
    const hasAvailability = searchParams.get('has_availability') // 'true' to filter members with availability setup
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit

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

    // Build query for member booking settings
    let query = supabase
      .from('member_booking_settings')
      .select('*', { count: 'exact' })
      .eq('tenant_id', userTenantId)

    // Apply filters
    if (tenantId && (userRole === 'admin_tenant' || userRole === 'staff')) {
      query = query.eq('tenant_id', tenantId)
    }

    if (allowBookings === 'true') {
      query = query.eq('allow_bookings', true)
    } else if (allowBookings === 'false') {
      query = query.eq('allow_bookings', false)
    }

    if (isActive === 'true') {
      query = query.eq('is_active', true)
    } else if (isActive === 'false') {
      query = query.eq('is_active', false)
    }

    if (hasServices === 'true') {
      query = query.gt('assigned_services_count', 0)
    }

    if (hasAvailability === 'true') {
      query = query.gt('availability_entries_count', 0)
    }

    // Apply pagination and ordering
    const { data: memberSettings, error: settingsError, count } = await query
      .order('first_name', { ascending: true })
      .order('last_name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (settingsError) {
      console.error('Error fetching member booking settings:', settingsError)
      return NextResponse.json(
        { error: 'Failed to fetch member booking settings' },
        { status: 500 }
      )
    }

    // Get summary statistics
    const { data: summaryData, error: summaryError } = await supabase
      .from('member_booking_settings')
      .select('allow_bookings, assigned_services_count, availability_entries_count, is_active')
      .eq('tenant_id', userTenantId)

    let summary = {
      total_members: 0,
      active_members: 0,
      members_allowing_bookings: 0,
      members_with_services: 0,
      members_with_availability: 0,
      members_ready_for_bookings: 0
    }

    if (!summaryError && summaryData) {
      summary = {
        total_members: summaryData.length,
        active_members: summaryData.filter(m => m.is_active).length,
        members_allowing_bookings: summaryData.filter(m => m.allow_bookings && m.is_active).length,
        members_with_services: summaryData.filter(m => m.assigned_services_count > 0 && m.is_active).length,
        members_with_availability: summaryData.filter(m => m.availability_entries_count > 0 && m.is_active).length,
        members_ready_for_bookings: summaryData.filter(m =>
          m.allow_bookings &&
          m.is_active &&
          m.assigned_services_count > 0 &&
          m.availability_entries_count > 0
        ).length
      }
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    // Add readiness status to each member
    const membersWithStatus = (memberSettings || []).map(member => ({
      ...member,
      booking_readiness: {
        allows_bookings: member.allow_bookings,
        has_assigned_services: member.assigned_services_count > 0,
        has_availability_setup: member.availability_entries_count > 0,
        is_ready_for_bookings: member.allow_bookings &&
                               member.assigned_services_count > 0 &&
                               member.availability_entries_count > 0,
        missing_requirements: [
          ...(!member.allow_bookings ? ['allow_bookings disabled'] : []),
          ...(member.assigned_services_count === 0 ? ['no services assigned'] : []),
          ...(member.availability_entries_count === 0 ? ['no availability setup'] : [])
        ]
      }
    }))

    const response = {
      member_settings: membersWithStatus,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: count || 0,
        items_per_page: limit,
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage
      },
      filters: {
        tenant_id: userTenantId,
        allow_bookings: allowBookings,
        is_active: isActive,
        has_services: hasServices,
        has_availability: hasAvailability
      },
      summary
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in member booking settings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Bulk update member booking settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      member_ids,
      allow_bookings,
      reason,
      notes
    } = body

    if (!Array.isArray(member_ids) || member_ids.length === 0) {
      return NextResponse.json(
        { error: 'member_ids must be a non-empty array' },
        { status: 400 }
      )
    }

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

    // Only admin tenants can bulk update booking settings
    if (userRole !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Only admin tenants can bulk update member booking settings' },
        { status: 403 }
      )
    }

    // Verify all members exist and belong to this tenant
    const { data: members, error: membersError } = await supabase
      .from('custom_users')
      .select('id, first_name, last_name, email, allow_bookings')
      .in('id', member_ids)
      .eq('tenant_id', userTenantId)
      .eq('role', 'member')

    if (membersError || !members || members.length !== member_ids.length) {
      return NextResponse.json(
        { error: 'One or more members not found or not in your tenant' },
        { status: 404 }
      )
    }

    // Update all members' booking settings
    const { data: updatedMembers, error: updateError } = await supabase
      .from('custom_users')
      .update({
        allow_bookings,
        updated_at: new Date().toISOString()
      })
      .in('id', member_ids)
      .eq('tenant_id', userTenantId)
      .eq('role', 'member')
      .select('id, first_name, last_name, email, allow_bookings, updated_at')

    if (updateError) {
      console.error('Error bulk updating member booking settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to bulk update member booking settings' },
        { status: 500 }
      )
    }

    // Log the bulk change for audit purposes
    console.log('Bulk member booking settings changed:', {
      member_count: member_ids.length,
      member_ids,
      tenant_id: userTenantId,
      new_setting: allow_bookings,
      changed_by: user.id,
      changed_by_role: userRole,
      reason,
      notes,
      timestamp: new Date().toISOString()
    })

    const response = {
      success: true,
      updated_members: updatedMembers,
      members_updated_count: updatedMembers?.length || 0,
      new_setting: allow_bookings,
      updated_by: {
        id: user.id,
        role: userRole
      },
      updated_at: new Date().toISOString(),
      message: `Bulk update completed. ${updatedMembers?.length || 0} members ${allow_bookings ? 'can now' : 'cannot'} receive bookings.`
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in bulk member booking settings update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}