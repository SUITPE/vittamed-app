import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-api'
import { customAuth } from '@/lib/custom-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { clientId } = params
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status')
    const timeRange = searchParams.get('timeRange')

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

    // For clients, they can only access their own payments
    if (user.id !== clientId) {
      return NextResponse.json(
        { error: 'Forbidden - can only access own payments' },
        { status: 403 }
      )
    }

    // Build the query for payments
    let query = supabase
      .from('payments')
      .select(`
        id,
        appointment_id,
        amount,
        status,
        payment_method,
        transaction_id,
        created_at,
        paid_at,
        invoice_url,
        appointments (
          id,
          tenant_id,
          doctor_id,
          service_id,
          tenants (
            name
          ),
          doctors (
            first_name,
            last_name
          ),
          services (
            name
          )
        )
      `)
      .eq('client_id', clientId)

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status)
    }

    // Apply time range filter if provided
    if (timeRange) {
      const now = new Date()
      let fromDate = new Date()

      switch (timeRange) {
        case 'last7days':
          fromDate.setDate(now.getDate() - 7)
          break
        case 'last30days':
          fromDate.setDate(now.getDate() - 30)
          break
        case 'last3months':
          fromDate.setMonth(now.getMonth() - 3)
          break
        case 'lastyear':
          fromDate.setFullYear(now.getFullYear() - 1)
          break
      }

      if (timeRange !== '') {
        query = query.gte('created_at', fromDate.toISOString())
      }
    }

    const { data: payments, error: paymentsError } = await query
      .order('created_at', { ascending: false })

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    // Transform the data to match the expected format
    const transformedPayments = (payments || []).map(payment => {
      const appointment = Array.isArray(payment.appointments) ? payment.appointments[0] : payment.appointments
      const service = Array.isArray(appointment?.services) ? appointment.services[0] : appointment?.services
      const doctor = Array.isArray(appointment?.doctors) ? appointment.doctors[0] : appointment?.doctors
      const tenant = Array.isArray(appointment?.tenants) ? appointment.tenants[0] : appointment?.tenants

      return {
        id: payment.id,
        appointment_id: payment.appointment_id,
        service_name: service?.name || 'Unknown Service',
        doctor_name: `${doctor?.first_name || ''} ${doctor?.last_name || ''}`.trim(),
        tenant_name: tenant?.name || 'Unknown Tenant',
        amount: payment.amount,
        status: payment.status,
        payment_method: payment.payment_method || 'card',
        transaction_id: payment.transaction_id,
        created_at: payment.created_at,
        paid_at: payment.paid_at,
        invoice_url: payment.invoice_url
      }
    })

    return NextResponse.json(transformedPayments)

  } catch (error) {
    console.error('Error in client payments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}