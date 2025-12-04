import { NextRequest, NextResponse } from 'next/server'

// VT-37: Simplified booking endpoint that directly uses VT-36 and VT-18 validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tenant_id,
      service_id,
      provider_type, // 'doctor' or 'member'
      doctor_id,
      member_id,
      appointment_date,
      start_time,
      patient_first_name,
      patient_last_name,
      patient_email,
      patient_phone
    } = body

    // Validate required fields
    if (!tenant_id || !service_id || !provider_type || !appointment_date || !start_time ||
        !patient_first_name || !patient_last_name || !patient_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate provider selection
    if (provider_type === 'doctor' && !doctor_id) {
      return NextResponse.json(
        { error: 'doctor_id is required when provider_type is doctor' },
        { status: 400 }
      )
    }

    if (provider_type === 'member' && !member_id) {
      return NextResponse.json(
        { error: 'member_id is required when provider_type is member' },
        { status: 400 }
      )
    }

    // Use the existing appointment API that already has VT-36 and VT-18 validation
    const appointmentData: any = {
      tenant_id,
      service_id,
      appointment_date,
      start_time,
      patient_first_name,
      patient_last_name,
      patient_email,
      patient_phone
    }

    // Add the appropriate provider ID
    if (provider_type === 'doctor') {
      appointmentData.doctor_id = doctor_id
    } else {
      appointmentData.member_id = member_id
    }

    // Call the enhanced appointment API that has VT-36 + VT-18 validation
    const appointmentResponse = await fetch(`${request.url.split('/api')[0]}/api/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward any auth headers if present
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization')!
        })
      },
      body: JSON.stringify(appointmentData)
    })

    const appointmentResult = await appointmentResponse.json()

    if (!appointmentResponse.ok) {
      return NextResponse.json(
        {
          error: appointmentResult.error || 'Failed to create appointment',
          details: appointmentResult
        },
        { status: appointmentResponse.status }
      )
    }

    // Add booking confirmation details
    const bookingConfirmation = {
      success: true,
      appointment: appointmentResult,
      booking_details: {
        confirmation_id: appointmentResult.id,
        provider_type,
        provider_name: provider_type === 'doctor'
          ? `Dr. ${appointmentResult.doctor?.first_name} ${appointmentResult.doctor?.last_name}`.trim()
          : `${appointmentResult.member?.first_name} ${appointmentResult.member?.last_name}`.trim(),
        service_name: appointmentResult.service?.name,
        appointment_date,
        start_time,
        patient_name: `${patient_first_name} ${patient_last_name}`,
        status: appointmentResult.status || 'pending'
      },
      message: 'Appointment booked successfully! You will receive a confirmation email shortly.'
    }

    return NextResponse.json(bookingConfirmation, { status: 201 })

  } catch (error) {
    console.error('Error in simple booking API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}