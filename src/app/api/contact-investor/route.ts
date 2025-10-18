import { NextResponse } from 'next/server'
import { EMAIL_CONFIG } from '@/lib/config'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, name, message } = body

    // Validación básica
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email y nombre son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // En producción, aquí enviarías el email real
    // Por ahora, solo loggeamos la solicitud
    console.log('📧 Nueva solicitud de pitch deck:', {
      name,
      email,
      message: message || '(sin mensaje)',
      timestamp: new Date().toISOString(),
    })

    // TODO: Implementar envío de email real con Nodemailer o servicio similar
    // const emailSent = await sendInvestorContactEmail({ name, email, message })

    // Simulación de envío exitoso
    const response = {
      success: true,
      message: 'Solicitud recibida correctamente',
      data: {
        name,
        email,
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error processing investor contact:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

// Solo permitir POST
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
