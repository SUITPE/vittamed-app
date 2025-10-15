import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import type { MemberTimeSlot } from '@/types/catalog'

// Get member's availability for a specific date (with time slot generation)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { memberId } = await params
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const tenant_id = searchParams.get('tenant_id')
    const generate_slots = searchParams.get('generate_slots') === 'true'

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Verify member exists and belongs to tenant
    // VT-40: Include allow_bookings flag in member verification
    const { data: member, error: memberError } = await supabase
      .from('custom_users')
      .select('id, first_name, last_name, email, role, tenant_id, allow_bookings, is_active')
      .eq('id', memberId)
      .eq('role', 'member')
      .eq('tenant_id', tenant_id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found or not accessible' },
        { status: 404 }
      )
    }

    // VT-40: Check if member allows bookings when generating slots
    if (date && generate_slots && !member.allow_bookings) {
      return NextResponse.json(
        {
          error: 'Member is not currently accepting bookings',
          member: {
            id: member.id,
            name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email,
            allows_bookings: false
          },
          message: 'This member has disabled online bookings. Please contact the clinic directly.'
        },
        { status: 403 }
      )
    }

    if (date && generate_slots) {
      // Generate available time slots for specific date
      const selectedDate = new Date(date)
      const dayOfWeek = selectedDate.getDay()

      // Get member availability for the day
      const { data: availability, error: availabilityError } = await supabase
        .from('member_availability')
        .select('start_time, end_time')
        .eq('member_user_id', memberId)
        .eq('tenant_id', tenant_id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)

      if (availabilityError) {
        console.error('Error fetching member availability:', availabilityError)
        return NextResponse.json(
          { error: 'Failed to fetch member availability' },
          { status: 500 }
        )
      }

      // Get member breaks for the day
      const { data: breaks, error: breaksError } = await supabase
        .from('member_breaks')
        .select('start_time, end_time, break_type, description')
        .eq('member_user_id', memberId)
        .eq('tenant_id', tenant_id)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)

      if (breaksError) {
        console.error('Error fetching member breaks:', breaksError)
        return NextResponse.json(
          { error: 'Failed to fetch member breaks' },
          { status: 500 }
        )
      }

      // Get existing appointments for the date
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('start_time, end_time, status')
        .eq('assigned_member_id', memberId)
        .eq('tenant_id', tenant_id)
        .eq('appointment_date', date)
        .not('status', 'eq', 'cancelled')

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError)
        return NextResponse.json(
          { error: 'Failed to fetch appointments' },
          { status: 500 }
        )
      }

      // Generate time slots
      const timeSlots = generateMemberTimeSlots(availability || [], breaks || [], appointments || [])

      return NextResponse.json({
        member: {
          id: member.id,
          name: `${member.first_name} ${member.last_name}`.trim() || member.email,
          email: member.email
        },
        date,
        day_of_week: dayOfWeek,
        time_slots: timeSlots
      })

    } else {
      // Return member's weekly availability
      const { data: weeklyAvailability, error: availabilityError } = await supabase
        .from('member_availability')
        .select('*')
        .eq('member_user_id', memberId)
        .eq('tenant_id', tenant_id)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })

      if (availabilityError) {
        console.error('Error fetching weekly availability:', availabilityError)
        return NextResponse.json(
          { error: 'Failed to fetch weekly availability' },
          { status: 500 }
        )
      }

      // Get member breaks
      const { data: weeklyBreaks, error: breaksError } = await supabase
        .from('member_breaks')
        .select('*')
        .eq('member_user_id', memberId)
        .eq('tenant_id', tenant_id)
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })

      if (breaksError) {
        console.error('Error fetching weekly breaks:', breaksError)
        return NextResponse.json(
          { error: 'Failed to fetch weekly breaks' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        member: {
          id: member.id,
          name: `${member.first_name} ${member.last_name}`.trim() || member.email,
          email: member.email,
          allow_bookings: member.allow_bookings, // VT-40: Include booking flag
          is_active: member.is_active
        },
        availability: weeklyAvailability || [],
        breaks: weeklyBreaks || []
      })
    }

  } catch (error) {
    console.error('Error in member availability API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Generate time slots for a member considering availability, breaks, and existing appointments
function generateMemberTimeSlots(
  availability: Array<{ start_time: string; end_time: string }>,
  breaks: Array<{ start_time: string; end_time: string; break_type: string; description?: string }>,
  appointments: Array<{ start_time: string; end_time: string; status: string }>
): MemberTimeSlot[] {
  if (!availability || availability.length === 0) {
    return []
  }

  const slots: MemberTimeSlot[] = []
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
      const conflicts: Array<{
        type: 'appointment' | 'break' | 'unavailable'
        description?: string
      }> = []

      // Check for break conflicts
      const conflictsWithBreak = breaks.find(breakPeriod => {
        const slotMinutes = currentHour * 60 + currentMinute
        const breakStartMinutes = parseInt(breakPeriod.start_time.split(':')[0]) * 60 + parseInt(breakPeriod.start_time.split(':')[1])
        const breakEndMinutes = parseInt(breakPeriod.end_time.split(':')[0]) * 60 + parseInt(breakPeriod.end_time.split(':')[1])

        return slotMinutes >= breakStartMinutes && slotMinutes < breakEndMinutes
      })

      if (conflictsWithBreak) {
        conflicts.push({
          type: 'break',
          description: conflictsWithBreak.description || `${conflictsWithBreak.break_type} break`
        })
      }

      // Check for appointment conflicts
      const conflictsWithAppointment = appointments.find(appointment => {
        return timeSlot >= appointment.start_time && timeSlot < appointment.end_time
      })

      if (conflictsWithAppointment) {
        conflicts.push({
          type: 'appointment',
          description: `Existing ${conflictsWithAppointment.status} appointment`
        })
      }

      slots.push({
        time: timeSlot,
        is_available: conflicts.length === 0,
        conflicts: conflicts.length > 0 ? conflicts : undefined
      })

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