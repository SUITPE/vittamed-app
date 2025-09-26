import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  try {
    // Validate tenantId
    if (!tenantId || tenantId === 'null') {
      return NextResponse.json({ error: 'Invalid tenant ID' }, { status: 400 })
    }

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        patients!inner(first_name, last_name),
        doctors!inner(first_name, last_name),
        services!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .eq('appointment_date', date)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    const formattedAppointments = appointments.map((appointment: any) => ({
      id: appointment.id,
      patient_name: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
      doctor_name: `${appointment.doctors.first_name} ${appointment.doctors.last_name}`,
      service_name: appointment.services.name,
      start_time: appointment.start_time,
      status: appointment.status
    }))

    return NextResponse.json(formattedAppointments)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}