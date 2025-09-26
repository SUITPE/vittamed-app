import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { RemoveUserFromTenantRequest } from '@/types/user'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body: RemoveUserFromTenantRequest = await request.json()
    const { user_id, tenant_id } = body

    // Validate required fields
    if (!user_id || !tenant_id) {
      return NextResponse.json({
        error: 'user_id and tenant_id are required'
      }, { status: 400 })
    }

    // Check if current user is admin of the target tenant
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_tenant_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .single()

    if (rolesError || !userRoles || userRoles.role !== 'admin_tenant') {
      return NextResponse.json({
        error: 'Only tenant administrators can remove users from tenants'
      }, { status: 403 })
    }

    // Prevent admin from removing themselves
    if (user_id === user.id) {
      return NextResponse.json({
        error: 'Cannot remove yourself from tenant'
      }, { status: 400 })
    }

    // Remove user from tenant using database function
    const { data: success, error: removeError } = await supabase
      .rpc('remove_user_from_tenant', {
        user_uuid: user_id,
        tenant_uuid: tenant_id
      })

    if (removeError) {
      console.error('Error removing user from tenant:', removeError)
      return NextResponse.json({ error: 'Failed to remove user from tenant' }, { status: 500 })
    }

    // Get tenant information for response
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenant_id)
      .single()

    const tenantName = tenant?.name || 'tenant'

    return NextResponse.json({
      success: true,
      message: `Usuario removido de ${tenantName}`
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}