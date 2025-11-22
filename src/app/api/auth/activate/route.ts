import { NextRequest, NextResponse } from 'next/server'
import { verifyAndConsumeToken } from '@/lib/verification-tokens'
import { createAdminClient } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({
        error: 'Token y contraseña son requeridos'
      }, { status: 400 })
    }

    // Validar contraseña (mínimo 8 caracteres)
    if (password.length < 8) {
      return NextResponse.json({
        error: 'La contraseña debe tener al menos 8 caracteres'
      }, { status: 400 })
    }

    console.log('[Activate] Verifying token...')

    // Verificar y consumir token
    const verification = await verifyAndConsumeToken(token)

    if (!verification.success) {
      return NextResponse.json({
        error: verification.error
      }, { status: 400 })
    }

    const userId = verification.userId!

    console.log('[Activate] Token verified for user:', userId)

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    // Actualizar usuario: activar cuenta y establecer password
    const adminClient = await createAdminClient()
    const { error: updateError } = await adminClient
      .from('custom_users')
      .update({
        password_hash: passwordHash,
        email_verified: true,
        must_change_password: false,
        is_active: true
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[Activate] Error updating user:', updateError)
      return NextResponse.json({
        error: 'Error al activar la cuenta'
      }, { status: 500 })
    }

    console.log('[Activate] User account activated successfully:', userId)

    return NextResponse.json({
      success: true,
      message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.'
    })

  } catch (error) {
    console.error('[Activate] Unexpected error:', error)
    return NextResponse.json({
      error: 'Error al procesar la activación'
    }, { status: 500 })
  }
}
