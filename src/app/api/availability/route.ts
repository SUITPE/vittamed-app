import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')
    const date = searchParams.get('date')
    const tenantId = searchParams.get('tenantId')

    if (!doctorId || !date || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameters: doctorId, date, tenantId' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay()

    // Get doctor_tenant_id first
    const { data: doctorTenant, error: doctorTenantError } = await supabase
      .from('doctor_tenants')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('tenant_id', tenantId)
      .single()

    if (doctorTenantError || !doctorTenant) {
      return NextResponse.json({ error: 'Doctor not found for this tenant' }, { status: 404 })
    }

    // Get doctor availability for the day
    const { data: availability, error: availabilityError } = await supabase
      .from('doctor_availability')
      .select('start_time, end_time')
      .eq('doctor_tenant_id', doctorTenant.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)

    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    // Get doctor breaks for the day
    const { data: breaks, error: breaksError } = await supabase
      .from('doctor_breaks')
      .select('start_time, end_time')
      .eq('doctor_tenant_id', doctorTenant.id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)

    if (breaksError) {
      console.error('Error fetching breaks:', breaksError)
      return NextResponse.json({ error: 'Failed to fetch breaks' }, { status: 500 })
    }

    // Get existing appointments for the date
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('doctor_id', doctorId)
      .eq('tenant_id', tenantId)
      .eq('appointment_date', date)
      .not('status', 'eq', 'cancelled')

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    // Generate available time slots
    const timeSlots = generateTimeSlots(availability, breaks || [], appointments || [])

    return NextResponse.json(timeSlots)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateTimeSlots(
  availability: Array<{ start_time: string; end_time: string }>,
  breaks: Array<{ start_time: string; end_time: string }>,
  appointments: Array<{ start_time: string; end_time: string }>
): string[] {
  if (!availability || availability.length === 0) {
    return []
  }

  const slots: string[] = []
  const slotDuration = 30 // 30 minutes per slot

  availability.forEach(period => {
    const startHour = parseInt(period.start_time.split(':')[0])
    const startMinute = parseInt(period.start_time.split(':')[1])
    const endHour = parseInt(period.end_time.split(':')[0])
    const endMinute = parseInt(period.end_time.split(':')[1])

    let currentHour = startHour
    let currentMinute = startMinute

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

      // Check if this slot conflicts with breaks
      const conflictsWithBreak = breaks.some(breakPeriod => {
        const slotTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
        const breakStart = breakPeriod.start_time.slice(0, 5) // Ensure HH:MM format
        const breakEnd = breakPeriod.end_time.slice(0, 5)

        // Convert to minutes for proper comparison
        const slotMinutes = currentHour * 60 + currentMinute
        const breakStartMinutes = parseInt(breakStart.split(':')[0]) * 60 + parseInt(breakStart.split(':')[1])
        const breakEndMinutes = parseInt(breakEnd.split(':')[0]) * 60 + parseInt(breakEnd.split(':')[1])

        return slotMinutes >= breakStartMinutes && slotMinutes < breakEndMinutes
      })

      // Check if this slot conflicts with existing appointments
      const conflictsWithAppointment = appointments.some(appointment => {
        const appointmentStart = appointment.start_time
        const appointmentEnd = appointment.end_time
        return timeSlot >= appointmentStart && timeSlot < appointmentEnd
      })

      if (!conflictsWithBreak && !conflictsWithAppointment) {
        slots.push(timeSlot)
      }

      // Increment by slot duration
      currentMinute += slotDuration
      if (currentMinute >= 60) {
        currentHour += 1
        currentMinute = 0
      }
    }
  })

  return slots
}