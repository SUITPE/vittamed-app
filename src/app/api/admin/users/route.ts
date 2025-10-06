import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { UserRole, isValidUserRole } from '@/types/user'
import { sendEmailNotification } from '@/lib/notifications'

interface CreateUserRequest {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  temp_password?: string
  role?: UserRole
  tenant_id?: string
  send_invitation?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user (must be admin)
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if current user is admin, staff or receptionist
    const userRole = user.profile?.role

    if (!userRole) {
      return NextResponse.json({
        error: 'User profile not found'
      }, { status: 403 })
    }

    const allowedRoles = ['admin_tenant', 'staff', 'receptionist']

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({
        error: 'Only administrators, staff and receptionists can create users'
      }, { status: 403 })
    }

    const body: CreateUserRequest = await request.json()
    const {
      email,
      first_name,
      last_name,
      phone,
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

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({
          error: 'Invalid email format'
        }, { status: 400 })
      }

      // Check if user already exists by email
      const { data: existingProfile } = await supabase
        .from('custom_users')
        .select('*')
        .eq('email', email)
        .maybeSingle()

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

    // Generate new UUID for user
    const { randomUUID } = await import('crypto')
    const userId = randomUUID()

    // Hash the password
    const passwordHash = await customAuth.hashPassword(temp_password)

    // Create user profile with tenant_id directly
    const { data: profile, error: profileError } = await supabase
      .from('custom_users')
      .insert({
        id: userId,
        email: email || null,
        first_name: first_name || null,
        last_name: last_name || null,
        phone: phone || null,
        password_hash: passwordHash,
        role: role, // Use the role provided in the request
        tenant_id: tenant_id || null, // Set tenant_id directly
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', {
        error: profileError,
        message: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint,
        requestData: {
          email,
          first_name,
          last_name,
          role,
          tenant_id
        }
      })
      return NextResponse.json({
        error: 'Failed to create user profile',
        details: profileError.message,
        code: profileError.code
      }, { status: 500 })
    }

    // If user is a doctor, create entries in doctors and doctor_tenants tables
    if (role === 'doctor') {
      console.log('🔍 Creating doctor profile for user:', { userId, email, tenant_id })

      // Step 1: Create entry in doctors table
      const { error: doctorError } = await supabase
        .from('doctors')
        .insert({
          id: userId,
          first_name: first_name || '',
          last_name: last_name || '',
          email: email || '',
          phone: phone || null,
          specialty: null,
          license_number: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (doctorError) {
        console.error('❌ Error creating doctor entry:', {
          error: doctorError,
          message: doctorError.message,
          userId,
          email
        })
        // Rollback: delete the custom_users entry
        await supabase.from('custom_users').delete().eq('id', userId)
        return NextResponse.json({
          error: 'Failed to create doctor profile',
          details: doctorError.message
        }, { status: 500 })
      }

      console.log('✅ Doctor entry created successfully')

      // Step 2: Create entry in doctor_tenants table if tenant_id provided
      if (tenant_id) {
        const { error: doctorTenantError } = await supabase
          .from('doctor_tenants')
          .insert({
            doctor_id: userId,
            tenant_id: tenant_id,
            is_active: true,
            hourly_rate: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (doctorTenantError) {
          console.error('❌ Error creating doctor_tenant entry:', {
            error: doctorTenantError,
            message: doctorTenantError.message,
            userId,
            tenant_id
          })
          // Rollback: delete both custom_users and doctors entries
          await supabase.from('doctors').delete().eq('id', userId)
          await supabase.from('custom_users').delete().eq('id', userId)
          return NextResponse.json({
            error: 'Failed to link doctor to tenant',
            details: doctorTenantError.message
          }, { status: 500 })
        }

        console.log('✅ Doctor-tenant link created successfully')
      } else {
        console.log('⚠️ No tenant_id provided, skipping doctor_tenants entry')
      }
    }

    // Get tenant info for response and email
    let tenantName = 'VittaMed'
    if (tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', tenant_id)
        .maybeSingle()

      tenantName = tenant?.name || tenantName
    }

    // Send invitation email if requested
    if (send_invitation && email) {
      const roleNames: Record<UserRole, string> = {
        super_admin: 'Super Administrador',
        admin_tenant: 'Administrador',
        doctor: 'Doctor/a',
        staff: 'Personal',
        receptionist: 'Recepcionista',
        patient: 'Paciente',
        member: 'Miembro',
        client: 'Cliente'
      }

      await sendEmailNotification({
        recipientEmail: email,
        subject: `Invitación a ${tenantName}`,
        content: `Has sido invitado/a como ${roleNames[role]} a ${tenantName}. Puedes acceder a la plataforma usando las credenciales proporcionadas abajo.`,
        type: 'user_invitation',
        metadata: {
          tempPassword: temp_password,
          tenantName: tenantName,
          firstName: first_name || '',
          role: roleNames[role]
        }
      }).catch(error => {
        console.error('Error sending invitation email:', error)
        // No bloqueamos la creación del usuario si falla el email
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
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
    console.error('Unexpected error in POST /api/admin/users:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get user by email (for checking if user exists)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user (must be admin)
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const url = new URL(request.url)
    const email = url.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email parameter required' }, { status: 400 })
    }

    // Check if user exists in profiles
    const { data: profile, error: profileError } = await supabase
      .from('custom_users')
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