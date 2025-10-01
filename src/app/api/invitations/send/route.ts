import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { invitationService, InvitationData } from '@/lib/invitations'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user and verify authentication
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (!userRole || userRole !== 'admin_tenant') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { email, first_name, last_name, role } = body

    // Validate required fields
    if (!email || !role) {
      return NextResponse.json({
        error: 'Email and role are required'
      }, { status: 400 })
    }

    // Validate role
    const validRoles = ['admin_tenant', 'doctor', 'staff', 'patient']
    if (!validRoles.includes(role)) {
      return NextResponse.json({
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({
        error: 'User with this email already exists'
      }, { status: 409 })
    }

    // Get tenant information
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', userTenantId)
      .single()

    if (!tenant) {
      return NextResponse.json({
        error: 'Tenant not found'
      }, { status: 404 })
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword()

    // Create invitation data
    const invitationData: InvitationData = {
      email,
      first_name,
      last_name,
      role,
      tenant_id: userTenantId,
      tenant_name: tenant.name,
      inviter_name: `${userProfile.first_name} ${userProfile.last_name}`.trim() || 'Admin',
      temp_password: tempPassword
    }

    // Create user account with temporary password
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role,
        tenant_id: userTenantId,
        invited_by: user.id,
        is_invited: true
      }
    })

    if (createUserError) {
      console.error('Error creating user:', createUserError)
      return NextResponse.json({
        error: 'Failed to create user account'
      }, { status: 500 })
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: newUser.user.id,
        email,
        first_name,
        last_name,
        role,
        tenant_id: userTenantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      // Note: User created but profile failed - this should be handled
    }

    // Send invitation email
    const emailSent = await invitationService.sendInvitationEmail(invitationData)

    // Create invitation record for tracking
    const invitationId = await invitationService.createInvitationRecord(invitationData)

    return NextResponse.json({
      success: true,
      message: `Invitation sent successfully to ${email}`,
      invitation_id: invitationId,
      email_sent: emailSent,
      temp_password: tempPassword, // Only for demo purposes
      user_id: newUser.user.id
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate a temporary password for new users
 */
function generateTemporaryPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}