import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Authenticate using authService
    const { error } = await authService.signIn(email, password)

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Error al iniciar sesión' },
        { status: 401 }
      )
    }

    // Get current user
    const user = await authService.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 401 }
      )
    }

    // Determine redirect path based on role
    let redirectPath = '/dashboard'

    if (user.profile) {
      const role = user.profile.role
      const tenantId = user.profile.tenant_id

      if (role === 'admin_tenant' || role === 'staff' || role === 'receptionist') {
        if (tenantId) {
          redirectPath = `/dashboard/${tenantId}`
        }
      } else if (role === 'doctor') {
        redirectPath = '/agenda'
      } else if (role === 'patient') {
        redirectPath = '/my-appointments'
      }
    }

    return NextResponse.json({
      success: true,
      redirectPath,
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile
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