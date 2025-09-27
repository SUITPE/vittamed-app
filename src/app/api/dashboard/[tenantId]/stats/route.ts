import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  const supabase = await getSupabaseServerClient()
  try {
    // Validate tenantId
    if (!tenantId || tenantId === 'null') {
      return NextResponse.json({ error: 'Invalid tenant ID' }, { status: 400 })
    }

    const today = new Date()
    const todayString = today.toISOString().split('T')[0]

    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    const weekString = startOfWeek.toISOString().split('T')[0]

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthString = startOfMonth.toISOString().split('T')[0]

    const [
      todayAppointmentsResult,
      weekAppointmentsResult,
      monthRevenueResult,
      activePatientsResult,
      pendingAppointmentsResult
    ] = await Promise.all([
      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('appointment_date', todayString),

      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .gte('appointment_date', weekString),

      supabase
        .from('appointments')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .gte('appointment_date', monthString),

      supabase
        .from('patients')
        .select('id', { count: 'exact' }),

      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
    ])

    if (todayAppointmentsResult.error) {
      console.error('Error fetching today appointments:', todayAppointmentsResult.error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    if (weekAppointmentsResult.error) {
      console.error('Error fetching week appointments:', weekAppointmentsResult.error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    if (monthRevenueResult.error) {
      console.error('Error fetching month revenue:', monthRevenueResult.error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    if (activePatientsResult.error) {
      console.error('Error fetching active patients:', activePatientsResult.error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    if (pendingAppointmentsResult.error) {
      console.error('Error fetching pending appointments:', pendingAppointmentsResult.error)
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    const monthRevenue = monthRevenueResult.data?.reduce((sum, appointment) => {
      return sum + (appointment.total_amount || 0)
    }, 0) || 0

    const stats = {
      todayAppointments: todayAppointmentsResult.count || 0,
      weekAppointments: weekAppointmentsResult.count || 0,
      monthRevenue: Math.round(monthRevenue),
      activePatients: activePatientsResult.count || 0,
      pendingAppointments: pendingAppointmentsResult.count || 0
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}