import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { createVerificationToken } from '@/lib/verification-tokens'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    console.log('[Resend Activation] Processing request for email:', email)

    const adminClient = await createAdminClient()

    // Buscar usuario
    const { data: user, error } = await adminClient
      .from('custom_users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      console.log('[Resend Activation] User not found:', email)
      // No revelar si el usuario existe o no por seguridad
      return NextResponse.json({
        message: 'Si el email existe, se ha enviado un nuevo enlace de activación.'
      })
    }

    // Solo reenviar si no está verificado
    if (user.email_verified) {
      console.log('[Resend Activation] User already verified:', email)
      return NextResponse.json({
        error: 'Esta cuenta ya está activada'
      }, { status: 400 })
    }

    // Generar nuevo token
    const { token, expiresAt } = await createVerificationToken(user.id)

    console.log('[Resend Activation] New token generated for user:', user.id)

    // Obtener nombre del tenant
    const { data: tenant } = await adminClient
      .from('tenants')
      .select('name')
      .eq('id', user.tenant_id)
      .single()

    const tenantName = tenant?.name || 'VittaSami'

    // Enviar email
    try {
      await sendInvitationEmail({
        recipientEmail: user.email,
        recipientName: `${user.first_name} ${user.last_name}`,
        activationToken: token,
        tenantName
      })

      console.log('[Resend Activation] Activation email sent successfully to:', email)

      return NextResponse.json({
        success: true,
        message: 'Email de activación reenviado exitosamente'
      })
    } catch (emailError) {
      console.error('[Resend Activation] Failed to send email:', emailError)
      return NextResponse.json({
        error: 'Error al enviar email. Por favor intenta más tarde.'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('[Resend Activation] Unexpected error:', error)
    return NextResponse.json({
      error: 'Error al procesar solicitud'
    }, { status: 500 })
  }
}
