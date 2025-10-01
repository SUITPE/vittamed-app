import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { AddUserToTenantRequest, AddUserToTenantResponse, isValidUserRole } from '@/types/user'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body: AddUserToTenantRequest = await request.json()
    const { user_id, tenant_id, role, doctor_id } = body

    // Validate required fields
    if (!user_id || !tenant_id || !role) {
      return NextResponse.json({
        error: 'user_id, tenant_id, and role are required'
      }, { status: 400 })
    }

    // Validate role
    if (!isValidUserRole(role)) {
      return NextResponse.json({
        error: 'Invalid role. Must be: admin_tenant, doctor, patient, or staff'
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
        error: 'Only tenant administrators can assign users to tenants'
      }, { status: 403 })
    }

    // If assigning doctor role, validate doctor_id
    if (role === 'doctor' && !doctor_id) {
      return NextResponse.json({
        error: 'doctor_id is required when assigning doctor role'
      }, { status: 400 })
    }

    // Add user to tenant using database function
    const { data: roleId, error: assignError } = await supabase
      .rpc('add_user_to_tenant', {
        user_uuid: user_id,
        tenant_uuid: tenant_id,
        user_role: role,
        doctor_uuid: doctor_id || null
      })

    if (assignError) {
      console.error('Error assigning user to tenant:', assignError)

      // Handle specific error cases
      if (assignError.message?.includes('Invalid role')) {
        return NextResponse.json({ error: assignError.message }, { status: 400 })
      }

      return NextResponse.json({ error: 'Failed to assign user to tenant' }, { status: 500 })
    }

    // Get tenant information for response
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenant_id)
      .single()

    const tenantName = tenant?.name || 'tenant'

    const response: AddUserToTenantResponse = {
      success: true,
      role_id: roleId,
      message: `Usuario asignado como ${role} en ${tenantName}`
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}