import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-api'
import { customAuth } from '@/lib/custom-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { clientId } = await params

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication and that they are requesting their own data
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // For clients, they can only access their own appointments
    if (user.id !== clientId) {
      return NextResponse.json(
        { error: 'Forbidden - can only access own appointments' },
        { status: 403 }
      )
    }

    // Get appointments for this client across all tenants
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        tenant_id,
        doctor_id,
        service_id,
        start_time,
        end_time,
        status,
        notes,
        amount,
        payment_status,
        tenants (
          name,
          address
        ),
        doctors (
          first_name,
          last_name
        ),
        services (
          name,
          description,
          duration,
          price
        )
      `)
      .eq('patient_id', clientId)
      .order('start_time', { ascending: false })

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch appointments' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedAppointments = (appointments || []).map(appointment => {
      const tenant = Array.isArray(appointment.tenants) ? appointment.tenants[0] : appointment.tenants
      const doctor = Array.isArray(appointment.doctors) ? appointment.doctors[0] : appointment.doctors
      const service = Array.isArray(appointment.services) ? appointment.services[0] : appointment.services

      return {
        id: appointment.id,
        tenant_id: appointment.tenant_id,
        tenant_name: tenant?.name || 'Unknown Tenant',
        doctor_name: `${doctor?.first_name || ''} ${doctor?.last_name || ''}`.trim(),
        service_name: service?.name || 'Unknown Service',
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
        notes: appointment.notes,
        amount: appointment.amount || service?.price,
        payment_status: appointment.payment_status,
        location: tenant?.address
      }
    })

    return NextResponse.json(transformedAppointments)

  } catch (error) {
    console.error('Error in client appointments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}