import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const doctorId = searchParams.get('doctor_id')

  try {
    const supabase = await createClient()

    // Get current user and check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has access to this tenant
    const { data: userAccess, error: accessError } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (accessError || !userAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isAuthorized = userAccess.role === 'admin_tenant' ||
                        userAccess.role === 'receptionist' ||
                        (userAccess.role === 'doctor' && userAccess.tenant_id === tenantId)

    if (!isAuthorized) {
      return NextResponse.json({
        error: 'Only administrators, receptionists and doctors can view appointments'
      }, { status: 403 })
    }

    // Build query for appointments
    let query = supabase
      .from('appointments')
      .select(`
        id,
        patient_name,
        start_time,
        end_time,
        status,
        service_id,
        doctor_id,
        services (
          name
        ),
        doctors (
          first_name,
          last_name
        )
      `)
      .eq('tenant_id', tenantId)

    // Filter by date if provided
    if (date) {
      const startOfDay = `${date}T00:00:00`
      const endOfDay = `${date}T23:59:59`
      query = query.gte('start_time', startOfDay).lte('start_time', endOfDay)
    }

    // Filter by doctor if provided
    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }

    // Order by start time
    query = query.order('start_time', { ascending: true })

    const { data: appointments, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    // Transform the data to flatten doctor and service info
    const transformedAppointments = appointments?.map((appointment: any) => ({
      id: appointment.id,
      patient_name: appointment.patient_name,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      service_name: appointment.services?.name || 'Servicio no especificado',
      doctor_name: appointment.doctors
        ? `${appointment.doctors.first_name} ${appointment.doctors.last_name}`
        : 'Doctor no asignado',
      doctor_id: appointment.doctor_id
    })) || []

    return NextResponse.json({ appointments: transformedAppointments })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}