import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-api'
import { customAuth } from '@/lib/custom-auth'

// Get tenant by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params
    const supabase = await getSupabaseServerClient()

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userTenantId = user.profile?.tenant_id

    // Users can only access their own tenant
    if (userTenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, tenant_type, address, phone, email')
      .eq('id', tenantId)
      .single()

    if (tenantError) {
      console.error('Error fetching tenant:', tenantError)
      if (tenantError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to fetch tenant' },
        { status: 500 }
      )
    }

    return NextResponse.json(tenant)

  } catch (error) {
    console.error('Error in tenant API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update tenant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userRole = user.profile?.role
    const userTenantId = user.profile?.tenant_id

    // Users can only update their own tenant
    if (userTenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Only admin_tenant can update tenant settings
    if (userRole !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Only tenant administrators can update settings' },
        { status: 403 }
      )
    }

    // Prepare update data (only include allowed fields)
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.tenant_type !== undefined) updateData.tenant_type = body.tenant_type
    if (body.address !== undefined) updateData.address = body.address
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email

    const { data: updatedTenant, error: updateError } = await supabase
      .from('tenants')
      .update(updateData)
      .eq('id', tenantId)
      .select('id, name, tenant_type, address, phone, email')
      .single()

    if (updateError) {
      console.error('Error updating tenant:', updateError)
      return NextResponse.json(
        { error: 'Failed to update tenant' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedTenant)

  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
