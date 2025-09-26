import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { UserTenantsResponse, UserTenant } from '@/types/user'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's tenants using the database function
    const { data: userTenants, error: tenantsError } = await supabase
      .rpc('get_user_tenants', { user_uuid: user.id })

    if (tenantsError) {
      console.error('Error fetching user tenants:', tenantsError)
      return NextResponse.json({ error: 'Failed to fetch user tenants' }, { status: 500 })
    }

    // Transform the data to match our TypeScript types
    const tenants: UserTenant[] = (userTenants || []).map((tenant: any) => ({
      tenant_id: tenant.tenant_id,
      tenant_name: tenant.tenant_name,
      tenant_type: tenant.tenant_type,
      role: tenant.role,
      is_current: tenant.is_current
    }))

    const currentTenant = tenants.find(t => t.is_current)

    const response: UserTenantsResponse = {
      tenants,
      current_tenant: currentTenant
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { tenant_id } = body

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })
    }

    // Switch current tenant using the database function
    const { data: success, error: switchError } = await supabase
      .rpc('switch_current_tenant', { tenant_uuid: tenant_id })

    if (switchError) {
      console.error('Error switching tenant:', switchError)
      return NextResponse.json({ error: 'Failed to switch tenant' }, { status: 500 })
    }

    if (!success) {
      return NextResponse.json({
        error: 'Access denied to this tenant'
      }, { status: 403 })
    }

    // Get updated user tenants
    const { data: userTenants, error: tenantsError } = await supabase
      .rpc('get_user_tenants', { user_uuid: user.id })

    if (tenantsError) {
      console.error('Error fetching updated tenants:', tenantsError)
      return NextResponse.json({ error: 'Failed to fetch updated tenants' }, { status: 500 })
    }

    const tenants: UserTenant[] = (userTenants || []).map((tenant: any) => ({
      tenant_id: tenant.tenant_id,
      tenant_name: tenant.tenant_name,
      tenant_type: tenant.tenant_type,
      role: tenant.role,
      is_current: tenant.is_current
    }))

    const currentTenant = tenants.find(t => t.is_current)

    if (!currentTenant) {
      return NextResponse.json({ error: 'Failed to set current tenant' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      current_tenant: currentTenant,
      tenants,
      message: `Cambiado a ${currentTenant.tenant_name}`
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}