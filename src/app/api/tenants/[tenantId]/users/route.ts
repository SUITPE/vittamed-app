import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

interface RouteParams {
  tenantId: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const supabase = await createClient()
    const { tenantId } = params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if current user has access to this tenant
    const { data: userAccess, error: accessError } = await supabase
      .from('user_profiles')
      .select('role, tenantId')
      .eq('id', user.id)
      .single()

    if (accessError || !userAccess) {
      return NextResponse.json({
        error: 'Access denied'
      }, { status: 403 })
    }

    // For now, check if user is admin of this tenant or any tenant
    // In production with multi-tenant, you'd check user_tenant_roles table
    const isAdmin = userAccess.role === 'admin_tenant' &&
                   (userAccess.tenantId === tenantId || userAccess.role === 'admin_tenant')

    if (!isAdmin) {
      return NextResponse.json({
        error: 'Only tenant administrators can view tenant users'
      }, { status: 403 })
    }

    // Get all users for this tenant from the view (when multi-tenant is active)
    // For now, we'll use a simpler query until the migration is applied
    const { data: tenantUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        tenantId,
        created_at,
        updated_at
      `)
      .eq('tenantId', tenantId)

    if (usersError) {
      console.error('Error fetching tenant users:', usersError)
      return NextResponse.json({ error: 'Failed to fetch tenant users' }, { status: 500 })
    }

    // Transform data to match expected format
    const users = (tenantUsers || []).map(user => ({
      user_id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      tenantId: user.tenantId,
      tenant_name: '', // Will be filled by frontend if needed
      tenant_type: '',
      role: user.role,
      is_active: true, // Default for current system
      doctor_id: null,
      doctor_first_name: null,
      doctor_last_name: null,
      is_current_tenant: user.tenantId === tenantId,
      role_assigned_at: user.created_at
    }))

    return NextResponse.json({
      users,
      total: users.length
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Add user to specific tenant (alternative to general assign endpoint)
export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const supabase = await createClient()
    const { tenantId } = params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if current user is admin of this tenant
    const { data: userAccess, error: accessError } = await supabase
      .from('user_profiles')
      .select('role, tenantId')
      .eq('id', user.id)
      .single()

    if (accessError || !userAccess || userAccess.role !== 'admin_tenant') {
      return NextResponse.json({
        error: 'Only tenant administrators can add users'
      }, { status: 403 })
    }

    const body = await request.json()
    const { email, first_name, last_name, role = 'patient', send_invitation = true } = body

    // Validate required fields
    if (!email) {
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
        role,
        tenantId,
        send_invitation
      })
    })

    const userData = await createUserResponse.json()

    if (!createUserResponse.ok) {
      return NextResponse.json(userData, { status: createUserResponse.status })
    }

    return NextResponse.json(userData, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}