import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params
  const supabase = await createClient()

  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = user.email

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_email,
        service_name,
        start_time,
        status,
        tenant_id,
        stripe_payment_intent_id
      `)
      .eq('id', appointmentId)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.patient_email !== userEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json({ error: 'Appointment is already cancelled' }, { status: 400 })
    }

    if (appointment.status === 'completed') {
      return NextResponse.json({ error: 'Cannot cancel completed appointment' }, { status: 400 })
    }

    const appointmentDate = new Date(appointment.start_time)
    const now = new Date()
    const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilAppointment < 24) {
      return NextResponse.json(
        { error: 'Cannot cancel appointment less than 24 hours in advance' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)

    if (updateError) {
      console.error('Error cancelling appointment:', updateError)
      return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 })
    }

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        tenant_id: appointment.tenant_id,
        type: 'appointment_cancelled',
        recipient_email: appointment.patient_email,
        subject: 'Cita cancelada - VittaSami',
        content: `Tu cita para ${appointment.service_name} programada para el ${appointmentDate.toLocaleDateString('es-ES')} ha sido cancelada exitosamente.`,
        appointment_id: appointmentId,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (notificationError) {
      console.error('Error creating cancellation notification:', notificationError)
    }

    return NextResponse.json({ success: true, message: 'Appointment cancelled successfully' })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}