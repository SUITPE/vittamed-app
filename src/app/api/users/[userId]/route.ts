import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { sendAssignmentEmail } from '@/lib/email'

interface RouteParams {
  userId: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> }
) {
  const { userId } = await params
  try {
    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check user role - only admin_tenant, staff, and receptionist can update users
    const userRole = user.profile?.role
    if (userRole !== 'admin_tenant' && userRole !== 'staff' && userRole !== 'receptionist') {
      return NextResponse.json({
        error: 'Only administrators, staff and receptionists can update users'
      }, { status: 403 })
    }

    const body = await request.json()
    const { tenant_id, role } = body

    console.log('[Users PATCH] Updating user:', {
      userId,
      tenant_id,
      role
    })

    // Use admin client to bypass RLS for UPDATE
    const adminClient = await createAdminClient()

    // Update user
    const { data: updatedUser, error: updateError } = await adminClient
      .from('custom_users')
      .update({
        tenant_id,
        role
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[Users PATCH] Error updating user:', updateError)
      return NextResponse.json({
        error: 'Failed to update user',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('[Users PATCH] User updated successfully:', userId)

    // Get tenant information for email
    const { data: tenant } = await adminClient
      .from('tenants')
      .select('name')
      .eq('id', tenant_id)
      .single()

    const tenantName = tenant?.name || 'VittaSami'

    // Send assignment notification email
    let emailSent = false
    let emailError: string | null = null

    if (updatedUser.email) {
      try {
        const assignedByName = user.profile?.first_name && user.profile?.last_name
          ? `${user.profile.first_name} ${user.profile.last_name}`
          : user.profile?.email || 'Administrador'

        await sendAssignmentEmail({
          recipientEmail: updatedUser.email,
          recipientName: `${updatedUser.first_name || ''} ${updatedUser.last_name || ''}`.trim() || updatedUser.email,
          tenantName,
          role: updatedUser.role,
          assignedBy: assignedByName
        })

        emailSent = true
        console.log('[Users PATCH] Assignment notification email sent to:', updatedUser.email)
      } catch (error) {
        console.error('[Users PATCH] Failed to send assignment notification email:', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
          recipient: updatedUser.email
        })
        emailError = error instanceof Error ? error.message : 'Failed to send email'
        // Don't fail the whole operation if email fails - user was already assigned
      }
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        role: updatedUser.role,
        tenant_id: updatedUser.tenant_id
      },
      message: 'Usuario asignado exitosamente al negocio',
      emailSent,
      emailError
    })

  } catch (error) {
    console.error('Unexpected error in PATCH /api/users/[userId]:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId
    })
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
