import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

interface RouteParams {
  tenantId: string
  userId: string
}

// Update user (PATCH)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { tenantId, userId } = await params

  try {
    const supabase = await createClient()
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only admin_tenant and staff can update users
    const userRole = user.profile?.role
    if (userRole !== 'admin_tenant' && userRole !== 'staff') {
      return NextResponse.json({
        error: 'Only administrators and staff can update users'
      }, { status: 403 })
    }

    const body = await request.json()
    const { schedulable, role, first_name, last_name, phone } = body

    // If trying to update schedulable, check if column exists first
    if (schedulable !== undefined) {
      // Try a test query to see if schedulable column exists
      const { error: testError } = await supabase
        .from('custom_users')
        .select('schedulable')
        .limit(1)

      if (testError) {
        // Column doesn't exist
        console.warn('schedulable column does not exist:', testError)
        return NextResponse.json({
          error: 'El campo "schedulable" no está disponible aún. Por favor aplica la migración: ALTER TABLE custom_users ADD COLUMN schedulable BOOLEAN NOT NULL DEFAULT false;',
          migration_required: true
        }, { status: 400 })
      }
    }

    // Build update object
    const updates: any = {}

    if (schedulable !== undefined) updates.schedulable = schedulable
    if (role !== undefined) updates.role = role
    if (first_name !== undefined) updates.first_name = first_name
    if (last_name !== undefined) updates.last_name = last_name
    if (phone !== undefined) updates.phone = phone
    updates.updated_at = new Date().toISOString()

    // Update user in custom_users
    const { data, error } = await supabase
      .from('custom_users')
      .update(updates)
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: data
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete user from tenant (DELETE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { tenantId, userId } = await params

  try {
    const supabase = await createClient()
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only admin_tenant and staff can delete users
    const userRole = user.profile?.role
    if (userRole !== 'admin_tenant' && userRole !== 'staff') {
      return NextResponse.json({
        error: 'Only administrators and staff can delete users'
      }, { status: 403 })
    }

    // Check if user is admin_tenant (cannot be deleted)
    const { data: userToDelete, error: fetchError } = await supabase
      .from('custom_users')
      .select('role')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single()

    if (fetchError || !userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userToDelete.role === 'admin_tenant') {
      return NextResponse.json({
        error: 'Cannot delete admin_tenant users'
      }, { status: 403 })
    }

    // Delete user (or mark as inactive depending on requirements)
    // For now, we'll just remove the tenant_id to "soft delete" from this tenant
    const { error: deleteError } = await supabase
      .from('custom_users')
      .update({ tenant_id: null, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'User removed from tenant successfully'
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
