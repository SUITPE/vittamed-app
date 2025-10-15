import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import DashboardClient from '@/components/admin/DashboardClient'

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

  // Fetch tenant info server-side
  let tenantInfo: TenantInfo = {
    id: tenantId,
    name: 'Clínica Demo',
    tenant_type: 'clínica'
  }

  try {
    const tenantResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tenants`,
      {
        headers: {
          Cookie: `vittamed-auth-token=${await customAuth.getTokenFromCookie()}`
        },
        cache: 'no-store'
      }
    )

    if (tenantResponse.ok) {
      const tenants = await tenantResponse.json()
      const tenant = tenants.find((t: any) => t.id === tenantId)
      if (tenant) {
        tenantInfo = {
          id: tenant.id,
          name: tenant.name,
          tenant_type: tenant.tenant_type
        }
      }
    }
  } catch (error) {
    console.warn('Failed to fetch tenant info, using fallback')
  }

  // Get today's date
  const today = new Date().toISOString().split('T')[0]

  // Fetch today's appointments server-side
  let todayAppointments: TodayAppointment[] = []
  try {
    const appointmentsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/dashboard/${tenantId}/appointments?date=${today}`,
      {
        headers: {
          Cookie: `vittamed-auth-token=${await customAuth.getTokenFromCookie()}`
        },
        cache: 'no-store'
      }
    )

    if (appointmentsResponse.ok) {
      todayAppointments = await appointmentsResponse.json()
    }
  } catch (error) {
    console.warn('Failed to fetch appointments, using empty list')
  }

  // Fetch dashboard stats server-side
  let stats: DashboardStats = {
    todayAppointments: 0,
    weekAppointments: 0,
    monthRevenue: 0,
    activePatients: 0,
    pendingAppointments: 0
  }

  try {
    const statsResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/dashboard/${tenantId}/stats`,
      {
        headers: {
          Cookie: `vittamed-auth-token=${await customAuth.getTokenFromCookie()}`
        },
        cache: 'no-store'
      }
    )

    if (statsResponse.ok) {
      stats = await statsResponse.json()
    }
  } catch (error) {
    console.warn('Failed to fetch stats, using defaults')
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
