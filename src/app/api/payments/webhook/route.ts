import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object

      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('id, patient_email, service_name, tenant_id')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single()

      if (fetchError || !appointment) {
        console.error('Error finding appointment:', fetchError)
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }

      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          payment_status: 'completed',
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.id)

      if (updateError) {
        console.error('Error updating appointment:', updateError)
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
      }

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          tenant_id: appointment.tenant_id,
          type: 'payment_success',
          recipient_email: appointment.patient_email,
          subject: 'Pago confirmado - VittaSami',
          content: `Tu pago para la cita de ${appointment.service_name} ha sido confirmado exitosamente.`,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object

      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('id, patient_email, service_name, tenant_id')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single()

      if (fetchError || !appointment) {
        console.error('Error finding appointment:', fetchError)
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
      }

      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.id)

      if (updateError) {
        console.error('Error updating appointment:', updateError)
        return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
      }

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          tenant_id: appointment.tenant_id,
          type: 'payment_failed',
          recipient_email: appointment.patient_email,
          subject: 'Problema con el pago - VittaSami',
          content: `Hubo un problema con tu pago para la cita de ${appointment.service_name}. Por favor intenta de nuevo.`,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }
}