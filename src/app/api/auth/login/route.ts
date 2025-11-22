import { NextRequest, NextResponse } from 'next/server'
import { customAuth } from '@/lib/custom-auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Authenticate using custom auth
    const userProfile = await customAuth.authenticateUser(email, password)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!userProfile.email_verified) {
      return NextResponse.json({
        error: 'Debes activar tu cuenta antes de iniciar sesión. Revisa tu email.',
        requiresActivation: true
      }, { status: 403 })
    }

    // Check if user must change password (legacy users)
    if (userProfile.must_change_password) {
      // Generate temporary token for password change
      const tempToken = customAuth.generateToken({
        userId: userProfile.id,
        email: userProfile.email,
        role: userProfile.role,
        tenantId: userProfile.tenant_id || undefined
      })

      return NextResponse.json({
        requiresPasswordChange: true,
        redirectPath: '/auth/change-password',
        tempToken
      })
    }

    // Generate JWT token
    const token = customAuth.generateToken({
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      tenantId: userProfile.tenant_id || undefined
    })

    // Determine redirect path
    const redirectPath = customAuth.getRedirectPath(userProfile)

    console.log('✅ Custom auth login successful:', {
      userId: userProfile.id,
      email: userProfile.email,
      role: userProfile.role,
      redirectPath
    })

    // Remove password_hash from response for security
    const { password_hash, ...safeProfile } = userProfile

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      redirectPath,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        profile: safeProfile
      }
    })

    // Set authentication cookie in response
    response.cookies.set('vittasami-auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}