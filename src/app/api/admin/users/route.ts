import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { UserRole, isValidUserRole } from '@/types/user'

interface CreateUserRequest {
  email: string
  first_name?: string
  last_name?: string
  temp_password?: string
  role?: UserRole
  tenant_id?: string
  send_invitation?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user (must be admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if current user is admin of any tenant
    const { data: adminRoles, error: rolesError } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (rolesError || !adminRoles || adminRoles.role !== 'admin_tenant') {
      return NextResponse.json({
        error: 'Only tenant administrators can create users'
      }, { status: 403 })
    }

    const body: CreateUserRequest = await request.json()
    const {
      email,
      first_name,
      last_name,
      temp_password = 'VittaMed2024!',
      role = 'patient',
      tenant_id,
      send_invitation = true
    } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    // Validate role
    if (!isValidUserRole(role)) {
      return NextResponse.json({
        error: 'Invalid role. Must be: admin_tenant, doctor, patient, or staff'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Invalid email format'
      }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingAuth } = await supabase.auth.admin.getUserByEmail(email)

    if (existingAuth.user) {
      // User exists in auth, check if they have a profile
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (existingProfile) {
        return NextResponse.json({
          error: 'User already exists',
          user: {
            id: existingProfile.id,
            email: existingProfile.email,
            first_name: existingProfile.first_name,
            last_name: existingProfile.last_name
          }
        }, { status: 409 })
      }
    }

    // Create user in Supabase Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: temp_password,
      email_confirm: !send_invitation, // If sending invitation, don't auto-confirm
      user_metadata: {
        first_name: first_name || '',
        last_name: last_name || '',
        role: role
      }
    })

    if (createError) {
      console.error('Error creating user in auth:', createError)

      // Handle specific error cases
      if (createError.message?.includes('already registered')) {
        return NextResponse.json({
          error: 'User with this email already exists'
        }, { status: 409 })
      }

      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 })
    }

    if (!newUser.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: newUser.user.id,
        email,
        first_name: first_name || null,
        last_name: last_name || null,
        role: 'patient', // Default role, will be overridden by tenant assignment
        tenant_id: null, // Will be set when assigned to tenant
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError)

      // If profile creation fails, try to clean up the auth user
      try {
        await supabase.auth.admin.deleteUser(newUser.user.id)
      } catch (cleanupError) {
        console.error('Error cleaning up auth user after profile creation failure:', cleanupError)
      }

      return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
    }

    // If tenant_id is provided, assign user to that tenant
    if (tenant_id) {
      try {
        const { data: roleId, error: assignError } = await supabase
          .rpc('add_user_to_tenant', {
            user_uuid: newUser.user.id,
            tenant_uuid: tenant_id,
            user_role: role,
            doctor_uuid: null
          })

        if (assignError) {
          console.error('Error assigning user to tenant:', assignError)
          // Don't fail the whole operation, user is created but not assigned
        }
      } catch (assignError) {
        console.error('Error in tenant assignment:', assignError)
      }
    }

    // TODO: Send invitation email if requested
    if (send_invitation) {
      // For now, we'll log this. In production, you'd integrate with an email service
      console.log(`TODO: Send invitation email to ${email} with temp password: ${temp_password}`)
    }

    // Get tenant info for response
    let tenantName = 'VittaMed'
    if (tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', tenant_id)
        .single()

      tenantName = tenant?.name || tenantName
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email,
        first_name,
        last_name,
        role,
        tenant_id
      },
      temp_password: send_invitation ? undefined : temp_password, // Only return password if not sending invitation
      message: `Usuario creado exitosamente${tenant_id ? ` y asignado a ${tenantName}` : ''}${send_invitation ? '. Se enviará invitación por email.' : ''}`
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get user by email (for checking if user exists)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user (must be admin)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const url = new URL(request.url)
    const email = url.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    // Check if user exists in profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name, role, tenant_id')
      .eq('email', email)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: profile
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}