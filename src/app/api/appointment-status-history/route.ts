import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// VT-38: General appointment status history API
// Provides access to status history across multiple appointments

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get('appointment_id')
    const tenantId = searchParams.get('tenant_id')
    const status = searchParams.get('status')
    const changedByRole = searchParams.get('changed_by_role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 items per page
    const offset = (page - 1) * limit

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

    // Build query for appointment lifecycle view
    let query = supabase
      .from('appointment_lifecycle_view')
      .select('*', { count: 'exact' })
      .eq('tenant_id', userProfile.tenant_id) // Always filter by user's tenant

    // Apply filters
    if (appointmentId) {
      query = query.eq('appointment_id', appointmentId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (changedByRole) {
      query = query.eq('changed_by_role', changedByRole)
    }

    // Additional tenant filter if specified (for admin queries)
    if (tenantId && userProfile.role === 'admin_tenant') {
      query = query.eq('tenant_id', tenantId)
    }

    // Apply pagination and ordering
    const { data: statusHistory, error: historyError, count } = await query
      .order('status_changed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (historyError) {
      console.error('Error fetching appointment status history:', historyError)
      return NextResponse.json(
        { error: 'Failed to fetch appointment status history' },
        { status: 500 }
      )
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    const response = {
      status_history: statusHistory || [],
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: count || 0,
        items_per_page: limit,
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage
      },
      filters: {
        appointment_id: appointmentId,
        tenant_id: userProfile.role === 'admin_tenant' ? tenantId : userProfile.tenant_id,
        status,
        changed_by_role: changedByRole
      },
      summary: {
        total_status_changes: count || 0,
        unique_appointments: statusHistory ?
          new Set(statusHistory.map(h => h.appointment_id)).size : 0
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in appointment status history API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create manual status history entry (for system operations)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      appointment_id,
      status,
      previous_status,
      reason,
      notes,
      automated = false,
      change_source = 'api'
    } = body

    if (!appointment_id || !status) {
      return NextResponse.json(
        { error: 'appointment_id and status are required' },
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

    // Verify appointment exists and user has access
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, tenant_id')
      .eq('id', appointment_id)
      .eq('tenant_id', userProfile.tenant_id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found or access denied' },
        { status: 404 }
      )
    }

    // Create status history entry
    const { data: historyEntry, error: historyError } = await supabase
      .from('appointment_status_history')
      .insert({
        appointment_id,
        tenant_id: userProfile.tenant_id,
        status,
        previous_status,
        changed_by_user_id: user.id,
        changed_by_role: userProfile.role,
        reason,
        notes,
        automated,
        change_source
      })
      .select('*')
      .single()

    if (historyError) {
      console.error('Error creating status history entry:', historyError)
      return NextResponse.json(
        { error: 'Failed to create status history entry' },
        { status: 500 }
      )
    }

    const response = {
      success: true,
      status_history_entry: historyEntry,
      message: 'Status history entry created successfully'
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating appointment status history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}