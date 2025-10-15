import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { stripe, formatAmountForStripe, CURRENCY } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 })
    }

    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { appointmentId, amount } = await request.json()

    if (!appointmentId || !amount) {
      return NextResponse.json(
        { error: 'appointmentId and amount are required' },
        { status: 400 }
      )
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_name,
        patient_email,
        service_name,
        tenant_id,
        tenants (name)
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount, CURRENCY),
      currency: CURRENCY,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        appointmentId: appointment.id,
        tenantId: appointment.tenant_id,
        patientEmail: appointment.patient_email,
        serviceName: appointment.service_name,
      },
      description: `Cita médica - ${appointment.service_name} para ${appointment.patient_name}`,
    })

    await supabase
      .from('appointments')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}