import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    console.log('🔍 Fetching appointments for:', {
      doctorId,
      date
    })

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        notes,
        patients!inner(first_name, last_name, email),
        services!inner(name)
      `)
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    const formattedAppointments = (appointments || []).map((appointment: any) => ({
      id: appointment.id,
      patient_name: `${appointment.patients?.first_name} ${appointment.patients?.last_name}`,
      patient_email: appointment.patients?.email,
      service_name: appointment.services?.name,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      notes: appointment.notes
    }))

    return NextResponse.json(formattedAppointments)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { appointmentId, status, notes } = await request.json()

    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'appointmentId and status are required' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, confirmed, completed, cancelled' },
        { status: 400 }
      )
    }

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, doctor_id, patient_email, service_name, tenant_id')
      .eq('id', appointmentId)
      .eq('doctor_id', doctorId)
      .single()

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating appointment:', updateError)
      return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
    }

    if (status === 'confirmed' || status === 'completed' || status === 'cancelled') {
      let notificationType = 'appointment_confirmation'
      let subject = 'Cita confirmada - VittaMed'
      let content = `Tu cita para ${appointment.service_name} ha sido confirmada.`

      if (status === 'completed') {
        notificationType = 'appointment_confirmation'
        subject = 'Cita completada - VittaMed'
        content = `Tu cita para ${appointment.service_name} ha sido completada. Gracias por tu visita.`
      } else if (status === 'cancelled') {
        notificationType = 'appointment_cancelled'
        subject = 'Cita cancelada - VittaMed'
        content = `Tu cita para ${appointment.service_name} ha sido cancelada. Puedes reagendar cuando desees.`
      }

      await supabase
        .from('notifications')
        .insert({
          tenant_id: appointment.tenant_id,
          type: notificationType,
          recipient_email: appointment.patient_email,
          subject,
          content,
          appointment_id: appointmentId,
          status: 'pending',
          created_at: new Date().toISOString()
        })
    }

    return NextResponse.json(updatedAppointment)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}