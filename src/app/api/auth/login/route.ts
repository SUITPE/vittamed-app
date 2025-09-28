import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Error al iniciar sesión' },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 401 }
      )
    }

    // Get user profile to determine redirect path
    let redirectPath = '/dashboard'

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, tenant_id')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin_tenant') {
        if (profile.tenant_id) {
          redirectPath = `/dashboard/${profile.tenant_id}`
        } else {
          // Get first available tenant for admin
          const { data: tenants } = await supabase
            .from('tenants')
            .select('id')
            .limit(1)

          if (tenants && tenants.length > 0) {
            redirectPath = `/dashboard/${tenants[0].id}`
          }
        }
      } else if (profile?.role === 'doctor') {
        redirectPath = '/agenda'
      } else if (profile?.role === 'patient') {
        redirectPath = '/my-appointments'
      }
    } catch (profileError) {
      console.error('Error fetching user profile:', profileError)
      // Continue with default redirect if profile fetch fails
    }

    return NextResponse.json({
      success: true,
      redirectPath,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    })

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}