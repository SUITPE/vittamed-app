import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      tenant_id,
      doctor_id,
      member_id, // VT-36: Support for member appointments
      service_id,
      appointment_date,
      start_time,
      patient_first_name,
      patient_last_name,
      patient_email,
      patient_phone
    } = body

    // Validate required fields - either doctor_id or member_id must be provided
    if (!tenant_id || (!doctor_id && !member_id) || !service_id || !appointment_date || !start_time ||
        !patient_first_name || !patient_last_name || !patient_email) {
      return NextResponse.json(
        { error: 'Missing required fields. Either doctor_id or member_id must be provided.' },
        { status: 400 }
      )
    }

    // Ensure only one provider type is selected
    if (doctor_id && member_id) {
      return NextResponse.json(
        { error: 'Cannot specify both doctor_id and member_id' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get service details to calculate end time and price
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('duration_minutes, price')
      .eq('id', service_id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // VT-36: If member_id is provided, validate that the member can provide this service
    if (member_id) {
      // VT-40: First check if member allows bookings
      const { data: memberProfile, error: memberProfileError } = await supabase
        .from('user_profiles')
        .select('allow_bookings, is_active, role')
        .eq('id', member_id)
        .eq('tenant_id', tenant_id)
        .eq('role', 'member')
        .single()

      if (memberProfileError || !memberProfile) {
        return NextResponse.json(
          { error: 'Selected member not found in your tenant' },
          { status: 400 }
        )
      }

      if (!memberProfile.allow_bookings) {
        return NextResponse.json(
          { error: 'Selected member is not currently accepting bookings' },
          { status: 400 }
        )
      }

      if (!memberProfile.is_active) {
        return NextResponse.json(
          { error: 'Selected member is not active' },
          { status: 400 }
        )
      }

      const { data: memberService, error: memberServiceError } = await supabase
        .from('member_services')
        .select('id, is_active')
        .eq('member_user_id', member_id)
        .eq('service_id', service_id)
        .eq('tenant_id', tenant_id)
        .eq('is_active', true)
        .single()

      if (memberServiceError || !memberService) {
        return NextResponse.json(
          { error: 'Selected member is not authorized to provide this service' },
          { status: 400 }
        )
      }

      // VT-18: Validate member availability for the requested time slot
      const appointmentDate = new Date(appointment_date)
      const dayOfWeek = appointmentDate.getDay()

      // Check if member has availability on this day of the week
      const { data: memberAvailability, error: availabilityError } = await supabase
        .from('member_availability')
        .select('start_time, end_time')
        .eq('member_user_id', member_id)
        .eq('tenant_id', tenant_id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)

      if (availabilityError) {
        console.error('Error checking member availability:', availabilityError)
        return NextResponse.json(
          { error: 'Failed to validate member availability' },
          { status: 500 }
        )
      }

      if (!memberAvailability || memberAvailability.length === 0) {
        return NextResponse.json(
          { error: 'Selected member is not available on this day of the week' },
          { status: 400 }
        )
      }

      // Calculate appointment end time for availability validation
      const startTimeDate = new Date(`2000-01-01T${start_time}:00`)
      const endTimeDate = new Date(startTimeDate.getTime() + service.duration_minutes * 60 * 1000)
      const appointment_end_time = endTimeDate.toTimeString().slice(0, 5)

      // Check if the appointment time falls within any availability period
      const isWithinAvailability = memberAvailability.some(availability => {
        return (
          start_time >= availability.start_time &&
          appointment_end_time <= availability.end_time
        )
      })

      if (!isWithinAvailability) {
        return NextResponse.json(
          { error: 'Appointment time is outside member\'s availability hours' },
          { status: 400 }
        )
      }

      // Check for member breaks that conflict with the appointment time
      const { data: memberBreaks, error: breaksError } = await supabase
        .from('member_breaks')
        .select('start_time, end_time, break_type')
        .eq('member_user_id', member_id)
        .eq('tenant_id', tenant_id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)

      if (breaksError) {
        console.error('Error checking member breaks:', breaksError)
        return NextResponse.json(
          { error: 'Failed to validate member breaks' },
          { status: 500 }
        )
      }

      // Check if appointment conflicts with any break
      const conflictsWithBreak = memberBreaks?.some(memberBreak => {
        return (
          (start_time >= memberBreak.start_time && start_time < memberBreak.end_time) ||
          (appointment_end_time > memberBreak.start_time && appointment_end_time <= memberBreak.end_time) ||
          (start_time <= memberBreak.start_time && appointment_end_time >= memberBreak.end_time)
        )
      })

      if (conflictsWithBreak) {
        const conflictingBreak = memberBreaks?.find(memberBreak => {
          return (
            (start_time >= memberBreak.start_time && start_time < memberBreak.end_time) ||
            (appointment_end_time > memberBreak.start_time && appointment_end_time <= memberBreak.end_time) ||
            (start_time <= memberBreak.start_time && appointment_end_time >= memberBreak.end_time)
          )
        })
        return NextResponse.json(
          { error: `Appointment time conflicts with member's ${conflictingBreak?.break_type || 'break'} period` },
          { status: 400 }
        )
      }
    }

    // Calculate end time
    const startTimeDate = new Date(`2000-01-01T${start_time}:00`)
    const endTimeDate = new Date(startTimeDate.getTime() + service.duration_minutes * 60 * 1000)
    const end_time = endTimeDate.toTimeString().slice(0, 5)

    // Check for conflicts (double booking prevention)
    // Build conflict query based on provider type (doctor or member)
    let conflictQuery = supabase
      .from('appointments')
      .select('id')
      .eq('tenant_id', tenant_id)
      .eq('appointment_date', appointment_date)
      .not('status', 'eq', 'cancelled')
      .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time})`)

    if (doctor_id) {
      conflictQuery = conflictQuery.eq('doctor_id', doctor_id)
    } else if (member_id) {
      // For members, we need to check the assigned_member_id field
      conflictQuery = conflictQuery.eq('assigned_member_id', member_id)
    }

    const { data: conflicts, error: conflictError } = await conflictQuery

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 })
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Time slot is no longer available' },
        { status: 409 }
      )
    }

    // Create or find patient
    let patient_id: string

    const { data: existingPatient, error: patientFindError } = await supabase
      .from('patients')
      .select('id')
      .eq('email', patient_email)
      .single()

    if (patientFindError && patientFindError.code !== 'PGRST116') {
      console.error('Error finding patient:', patientFindError)
      return NextResponse.json({ error: 'Failed to process patient information' }, { status: 500 })
    }

    if (existingPatient) {
      patient_id = existingPatient.id
    } else {
      // Create new patient
      const { data: newPatient, error: patientCreateError } = await supabase
        .from('patients')
        .insert({
          first_name: patient_first_name,
          last_name: patient_last_name,
          email: patient_email,
          phone: patient_phone
        })
        .select('id')
        .single()

      if (patientCreateError || !newPatient) {
        console.error('Error creating patient:', patientCreateError)
        return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
      }

      patient_id = newPatient.id
    }

    // Create appointment
    const appointmentData: any = {
      tenant_id,
      patient_id,
      service_id,
      appointment_date,
      start_time,
      end_time,
      status: 'pending',
      total_amount: service.price,
      paid_amount: 0,
      payment_status: 'pending'
    }

    // Add provider information based on type
    if (doctor_id) {
      appointmentData.doctor_id = doctor_id
    } else if (member_id) {
      appointmentData.assigned_member_id = member_id
      // For backward compatibility, we might still need a doctor_id
      // In a real implementation, you might want to handle this differently
      appointmentData.doctor_id = null
    }

    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select(`
        *,
        tenant:tenants(*),
        doctor:doctors(*),
        patient:patients(*),
        service:services(*)
      `)
      .single()

    if (appointmentError || !appointment) {
      console.error('Error creating appointment:', appointmentError)
      return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
    }

    // VT-44: Send automatic booking confirmation
    try {
      const { sendBookingConfirmation } = await import('@/lib/confirmation-templates')
      const confirmationSent = await sendBookingConfirmation(appointment.id, appointment.tenant_id, 'email')

      if (confirmationSent) {
        console.log(`Booking confirmation sent for appointment ${appointment.id}`)
      } else {
        console.warn(`Failed to send booking confirmation for appointment ${appointment.id}`)
      }
    } catch (confirmationError) {
      console.error('Error sending booking confirmation:', confirmationError)
      // Don't fail the appointment creation if confirmation fails
    }

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// VT-38: GET appointments with lifecycle information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const doctorId = searchParams.get('doctor_id')
    const memberId = searchParams.get('member_id')
    const patientId = searchParams.get('patient_id')
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    const includeHistory = searchParams.get('include_history') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Get current user profile for authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Build appointments query
    let query = supabase
      .from('appointments')
      .select(`
        *,
        tenant:tenants(id, name),
        doctor:doctors(id, first_name, last_name, email, phone),
        patient:patients(id, first_name, last_name, email, phone),
        service:services(id, name, description, duration_minutes, price),
        assigned_member:user_profiles!appointments_assigned_member_id_fkey(id, first_name, last_name, email)
      `, { count: 'exact' })
      .eq('tenant_id', userProfile.tenant_id)

    // Apply filters
    if (tenantId && userProfile.role === 'admin_tenant') {
      query = query.eq('tenant_id', tenantId)
    }

    if (doctorId) {
      query = query.eq('doctor_id', doctorId)
    }

    if (memberId) {
      query = query.eq('assigned_member_id', memberId)
    }

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (date) {
      query = query.eq('appointment_date', date)
    }

    // Apply pagination and ordering
    const { data: appointments, error: appointmentsError, count } = await query
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })
      .range(offset, offset + limit - 1)

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      )
    }

    let appointmentsWithHistory = appointments || []

    // Include status history if requested
    if (includeHistory && appointments && appointments.length > 0) {
      const appointmentIds = appointments.map(apt => apt.id)

      const { data: statusHistory } = await supabase
        .from('appointment_status_history')
        .select('*')
        .in('appointment_id', appointmentIds)
        .order('created_at', { ascending: false })

      // Group status history by appointment_id
      const historyByAppointment = (statusHistory || []).reduce((acc, history) => {
        if (!acc[history.appointment_id]) {
          acc[history.appointment_id] = []
        }
        acc[history.appointment_id].push(history)
        return acc
      }, {} as Record<string, any[]>)

      // Add status history to each appointment
      appointmentsWithHistory = appointments.map(appointment => ({
        ...appointment,
        status_history: historyByAppointment[appointment.id] || [],
        status_change_count: (historyByAppointment[appointment.id] || []).length,
        last_status_change: (historyByAppointment[appointment.id] || [])[0]?.created_at || appointment.updated_at
      }))
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    const response = {
      appointments: appointmentsWithHistory,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: count || 0,
        items_per_page: limit,
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage
      },
      filters: {
        tenant_id: userProfile.tenant_id,
        doctor_id: doctorId,
        member_id: memberId,
        patient_id: patientId,
        status,
        date,
        include_history: includeHistory
      },
      summary: {
        total_appointments: count || 0,
        status_distribution: appointments ?
          appointments.reduce((acc, apt) => {
            acc[apt.status] = (acc[apt.status] || 0) + 1
            return acc
          }, {} as Record<string, number>) : {}
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}