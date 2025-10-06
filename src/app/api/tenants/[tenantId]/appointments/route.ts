import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

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

    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check user role and tenant access
    const userRole = user.profile?.role
    const userTenantId = user.profile?.tenant_id

    const isAuthorized = userRole === 'admin_tenant' ||
                        userRole === 'staff' ||
                        userRole === 'receptionist' ||
                        (userRole === 'doctor' && userTenantId === tenantId)

    if (!isAuthorized) {
      return NextResponse.json({
        error: 'Only administrators, staff, receptionists and doctors can view appointments'
      }, { status: 403 })
    }

    // Build query for appointments
    let query = supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        service_id,
        doctor_id,
        patient_id,
        patients (
          first_name,
          last_name
        ),
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
      query = query.eq('appointment_date', date)
    }

    // Filter by doctor if provided
    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }

    // Order by appointment_date and start time
    query = query.order('appointment_date', { ascending: true }).order('start_time', { ascending: true })

    const { data: appointments, error } = await query

    if (error) {
      console.error('Error fetching appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    // Transform the data to flatten patient, doctor and service info
    const transformedAppointments = appointments?.map((appointment: any) => ({
      id: appointment.id,
      appointment_date: appointment.appointment_date, // Add the date field separately
      patient_id: appointment.patient_id,
      patient_name: appointment.patients
        ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
        : 'Paciente no especificado',
      start_time: appointment.start_time, // Keep as time only (HH:MM:SS)
      end_time: appointment.end_time, // Keep as time only (HH:MM:SS)
      status: appointment.status,
      service_name: appointment.services?.name || 'Servicio no especificado',
      doctor_name: appointment.doctors
        ? `${appointment.doctors.first_name} ${appointment.doctors.last_name}`
        : 'Doctor no asignado',
      doctor_id: appointment.doctor_id
    })) || []

    console.log('📋 Appointments with patient_id:', transformedAppointments.map(a => ({ id: a.id, patient_id: a.patient_id })))

    return NextResponse.json({ appointments: transformedAppointments })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params

  try {
    const supabase = await createClient()

    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check user role and tenant access
    const userRole = user.profile?.role
    const userTenantId = user.profile?.tenant_id

    const isAuthorized = userRole === 'admin_tenant' ||
                        userRole === 'staff' ||
                        userRole === 'receptionist' ||
                        (userRole === 'doctor' && userTenantId === tenantId)

    if (!isAuthorized) {
      return NextResponse.json({
        error: 'Only administrators, staff, receptionists and doctors can create appointments'
      }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { patient_id, service_id, doctor_id, appointment_date, start_time, notes } = body

    // Validate required fields
    if (!patient_id || !service_id || !doctor_id || !appointment_date || !start_time) {
      return NextResponse.json({
        error: 'Missing required fields: patient_id, service_id, doctor_id, appointment_date, start_time'
      }, { status: 400 })
    }

    // Get service duration to calculate end_time
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes')
      .eq('id', service_id)
      .eq('tenant_id', tenantId)
      .single()

    if (serviceError || !service) {
      console.error('Service lookup error:', serviceError)
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Calculate end_time based on start_time and service duration
    const [hours, minutes] = start_time.split(':').map(Number)
    const startDate = new Date(appointment_date)
    startDate.setHours(hours, minutes, 0, 0)

    const endDate = new Date(startDate.getTime() + service.duration_minutes * 60000) // duration in minutes
    const end_time = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}:00`

    // Create appointment
    const { data: appointment, error: createError } = await supabase
      .from('appointments')
      .insert({
        tenant_id: tenantId,
        patient_id,
        service_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        status: 'pending',
        notes: notes || null
      })
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        patients (
          first_name,
          last_name,
          email
        ),
        services (
          name
        ),
        doctors (
          first_name,
          last_name
        )
      `)
      .single()

    if (createError) {
      console.error('Error creating appointment:', createError)
      return NextResponse.json({ error: 'Failed to create appointment', details: createError.message }, { status: 500 })
    }

    // Transform the response
    const transformedAppointment = {
      id: appointment.id,
      appointment_date: appointment.appointment_date,
      patient_name: appointment.patients
        ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
        : 'Paciente no especificado',
      patient_email: appointment.patients?.email,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      service_name: appointment.services?.name || 'Servicio no especificado',
      doctor_name: appointment.doctors
        ? `${appointment.doctors.first_name} ${appointment.doctors.last_name}`
        : 'Doctor no asignado'
    }

    return NextResponse.json({ appointment: transformedAppointment }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error creating appointment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}