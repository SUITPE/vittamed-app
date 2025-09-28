import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        total_amount,
        payment_status,
        notes,
        created_at,
        services!inner(name),
        doctors!inner(first_name, last_name),
        tenants!inner(name)
      `)
      .eq('patient_id', session.user.id)
      .order('start_time', { ascending: false })

    if (error) {
      console.error('Error fetching user appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    const formattedAppointments = appointments.map((appointment: any) => ({
      id: appointment.id,
      service_name: appointment.services?.name,
      doctor_name: `${appointment.doctors?.first_name} ${appointment.doctors?.last_name}`,
      tenant_name: appointment.tenants?.name,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      price: appointment.total_amount,
      payment_status: appointment.payment_status,
      notes: appointment.notes,
      created_at: appointment.created_at
    }))

    return NextResponse.json(formattedAppointments)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}