import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import { createClient } from '@/lib/supabase-server'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import DashboardClient from '@/components/admin/DashboardClient'

// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'

interface DashboardStats {
  todayAppointments: number
  weekAppointments: number
  monthRevenue: number
  activePatients: number
  pendingAppointments: number
}

interface TodayAppointment {
  id: string
  patient_name: string
  doctor_name: string
  service_name: string
  start_time: string
  status: string
}

interface TenantInfo {
  id: string
  name: string
  tenant_type: string
}

interface PageProps {
  params: Promise<{
    tenantId: string
  }>
}

// Server Component - Fetches data server-side
export default async function TenantDashboard({ params }: PageProps) {
  // Await params (Next.js 15 requirement)
  const { tenantId } = await params

  // Server-side authentication
  const user = await customAuth.getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verify user has access to this tenant
  const userTenantId = user.profile?.tenant_id
  if (userTenantId !== tenantId) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  // Fetch tenant info directly from Supabase
  let tenantInfo: TenantInfo = {
    id: tenantId,
    name: 'Clínica Demo',
    tenant_type: 'clínica'
  }

  try {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, tenant_type')
      .eq('id', tenantId)
      .single()

    if (tenantError) {
      console.error('[Dashboard] Error fetching tenant:', tenantError)
    } else if (tenant) {
      tenantInfo = {
        id: tenant.id,
        name: tenant.name,
        tenant_type: tenant.tenant_type
      }
    }
  } catch (error) {
    console.warn('[Dashboard] Failed to fetch tenant info, using fallback')
  }

  // Get today's date
  const today = new Date().toISOString().split('T')[0]

  // Fetch today's appointments directly from Supabase
  let todayAppointments: TodayAppointment[] = []
  try {
    const { data: appointmentsData, error: appointmentsError } = await supabase
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
      .eq('appointment_date', today)
      .order('start_time', { ascending: true })

    if (appointmentsError) {
      console.error('[Dashboard] Error fetching appointments:', appointmentsError)
    } else if (appointmentsData) {
      todayAppointments = appointmentsData.map((appointment: any) => ({
        id: appointment.id,
        patient_name: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
        doctor_name: `${appointment.doctors.first_name} ${appointment.doctors.last_name}`,
        service_name: appointment.services.name,
        start_time: appointment.start_time,
        status: appointment.status
      }))
      console.log('[Dashboard] Today appointments fetched:', {
        count: todayAppointments.length,
        tenantId,
        date: today
      })
    }
  } catch (error) {
    console.warn('[Dashboard] Failed to fetch appointments, using empty list')
  }

  // Fetch dashboard stats directly from Supabase
  let stats: DashboardStats = {
    todayAppointments: 0,
    weekAppointments: 0,
    monthRevenue: 0,
    activePatients: 0,
    pendingAppointments: 0
  }

  try {
    const now = new Date()
    const todayString = now.toISOString().split('T')[0]

    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    const weekString = startOfWeek.toISOString().split('T')[0]

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthString = startOfMonth.toISOString().split('T')[0]

    // Use Promise.allSettled to handle individual query failures gracefully
    const results = await Promise.allSettled([
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
        .select('id, service_id, services(price)')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .gte('appointment_date', monthString),

      supabase
        .from('patients')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId),

      supabase
        .from('appointments')
        .select('id', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
    ])

    // Extract results safely
    const todayAppointmentsResult = results[0].status === 'fulfilled' ? results[0].value : { count: 0, data: null, error: results[0].reason }
    const weekAppointmentsResult = results[1].status === 'fulfilled' ? results[1].value : { count: 0, data: null, error: results[1].reason }
    const monthRevenueResult = results[2].status === 'fulfilled' ? results[2].value : { data: null, error: results[2].reason }
    const activePatientsResult = results[3].status === 'fulfilled' ? results[3].value : { count: 0, data: null, error: results[3].reason }
    const pendingAppointmentsResult = results[4].status === 'fulfilled' ? results[4].value : { count: 0, data: null, error: results[4].reason }

    // Log errors but don't fail the page
    if (results[0].status === 'rejected' || todayAppointmentsResult.error) {
      console.warn('[Dashboard] Error fetching today appointments count')
    }
    if (results[1].status === 'rejected' || weekAppointmentsResult.error) {
      console.warn('[Dashboard] Error fetching week appointments count')
    }
    if (results[2].status === 'rejected' || monthRevenueResult.error) {
      console.warn('[Dashboard] Error fetching month revenue')
    }
    if (results[3].status === 'rejected' || activePatientsResult.error) {
      console.warn('[Dashboard] Error fetching active patients')
    }
    if (results[4].status === 'rejected' || pendingAppointmentsResult.error) {
      console.warn('[Dashboard] Error fetching pending appointments')
    }

    // Calculate revenue from service prices (appointments with completed status)
    const monthRevenue = monthRevenueResult.data?.reduce((sum: number, appointment: any) => {
      const servicePrice = appointment.services?.price || 0
      return sum + servicePrice
    }, 0) || 0

    stats = {
      todayAppointments: todayAppointmentsResult.count || 0,
      weekAppointments: weekAppointmentsResult.count || 0,
      monthRevenue: Math.round(monthRevenue),
      activePatients: activePatientsResult.count || 0,
      pendingAppointments: pendingAppointmentsResult.count || 0
    }

    console.log('[Dashboard] Stats fetched:', stats)
  } catch (error) {
    console.warn('[Dashboard] Failed to fetch stats, using defaults:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar tenantId={tenantId} />
      <AdminHeader />
      <div className="md:ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          <DashboardClient
            tenantId={tenantId}
            tenantInfo={tenantInfo}
            initialStats={stats}
            initialAppointments={todayAppointments}
          />
        </div>
      </div>
    </div>
  )
}
