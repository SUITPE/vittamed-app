import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

interface RouteParams {
  tenantId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { tenantId } = await params
  try {
    const supabase = await createClient()

    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check user role and tenant access
    const userRole = user.profile?.role
    const userTenantId = user.profile?.tenant_id

    // Allow access for admin_tenant, staff, receptionist, and doctors from the same tenant
    const isAuthorized = (
      (userRole === 'admin_tenant' || userRole === 'staff' || userRole === 'receptionist') &&
      (userTenantId === tenantId || userRole === 'admin_tenant')
    ) || (
      userRole === 'doctor' && userTenantId === tenantId
    )

    if (!isAuthorized) {
      return NextResponse.json({
        error: 'Only tenant administrators, staff, receptionists and doctors can view tenant users'
      }, { status: 403 })
    }

    // Get query params
    const url = new URL(request.url)
    const roleFilter = url.searchParams.get('role')

    // Get all users for this tenant from custom_users table
    // Note: We include admin_tenant in the list as they manage the tenant
    // Note: schedulable field may not exist yet if migration hasn't been applied
    let query = supabase
      .from('custom_users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        tenant_id,
        schedulable,
        created_at,
        updated_at
      `)
      .eq('tenant_id', tenantId)

    // Apply role filter if provided
    if (roleFilter) {
      query = query.eq('role', roleFilter)
    }

    const { data: tenantUsers, error: usersError } = await query

    if (usersError) {
      console.error('Error fetching tenant users:', {
        error: usersError,
        message: usersError.message,
        code: usersError.code,
        details: usersError.details,
        hint: usersError.hint,
        tenantId
      })
      return NextResponse.json({
        error: 'Failed to fetch tenant users',
        details: usersError.message
      }, { status: 500 })
    }

    // Transform data to match expected format
    const users = (tenantUsers || []).map(user => {
      // If schedulable field doesn't exist yet (migration not applied),
      // infer it from role: doctors and members are schedulable
      const schedulable = user.schedulable !== undefined
        ? user.schedulable
        : (user.role === 'doctor' || user.role === 'member')

      return {
        user_id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: user.tenant_id,
        tenant_name: '', // Will be filled by frontend if needed
        tenant_type: '',
        role: user.role,
        is_active: true, // Default for current system
        schedulable,
        doctor_id: null,
        doctor_first_name: null,
        doctor_last_name: null,
        is_current_tenant: user.tenant_id === tenantId,
        role_assigned_at: user.created_at
      }
    })

    return NextResponse.json({
      users,
      total: users.length
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/tenants/[tenantId]/users:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      tenantId
    })
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Add user to specific tenant (alternative to general assign endpoint)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { tenantId } = await params
  try {
    const supabase = await createClient()

    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check user role
    const userRole = user.profile?.role

    if (userRole !== 'admin_tenant' && userRole !== 'staff' && userRole !== 'receptionist') {
      return NextResponse.json({
        error: 'Only administrators, staff and receptionists can add users'
      }, { status: 403 })
    }

    const body = await request.json()
    const { email, first_name, last_name, phone, role = 'patient', send_invitation = false } = body

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json({
        error: 'First name and last name are required'
      }, { status: 400 })
    }

    // For patients, email is optional
    if (!email && role !== 'patient') {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Create user via admin API
    const createUserResponse = await fetch(`${request.nextUrl.origin}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the authorization header
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        email,
        first_name,
        last_name,
        phone,
        role,
        tenant_id: tenantId,
        send_invitation
      })
    })

    const userData = await createUserResponse.json()

    if (!createUserResponse.ok) {
      return NextResponse.json(userData, { status: createUserResponse.status })
    }

    return NextResponse.json(userData, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in POST /api/tenants/[tenantId]/users:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      tenantId
    })
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}