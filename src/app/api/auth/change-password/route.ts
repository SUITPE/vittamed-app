import { NextRequest, NextResponse } from 'next/server'
import { customAuth } from '@/lib/custom-auth'
import { createAdminClient } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        error: 'Contraseñas requeridas'
      }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({
        error: 'La nueva contraseña debe tener al menos 8 caracteres'
      }, { status: 400 })
    }

    // Verificar contraseña actual
    if (!user.profile?.password_hash) {
      return NextResponse.json({
        error: 'No se puede cambiar la contraseña para este usuario'
      }, { status: 400 })
    }
    const passwordMatch = await bcrypt.compare(currentPassword, user.profile.password_hash)

    if (!passwordMatch) {
      return NextResponse.json({
        error: 'Contraseña actual incorrecta'
      }, { status: 401 })
    }

    // Hashear nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Actualizar contraseña
    const adminClient = await createAdminClient()
    const { error } = await adminClient
      .from('custom_users')
      .update({
        password_hash: newPasswordHash,
        must_change_password: false
      })
      .eq('id', user.id)

    if (error) {
      console.error('[Change Password] Error updating password:', error)
      return NextResponse.json({
        error: 'Error al actualizar contraseña'
      }, { status: 500 })
    }

    console.log('[Change Password] Password updated successfully for user:', user.id)

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    })

  } catch (error) {
    console.error('[Change Password] Unexpected error:', error)
    return NextResponse.json({
      error: 'Error al procesar solicitud'
    }, { status: 500 })
  }
}
