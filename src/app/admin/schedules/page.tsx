import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import { createClient } from '@/lib/supabase-server'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import SchedulesClient from '@/components/admin/SchedulesClient'

// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'

interface SchedulableUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
}

interface AvailabilityBlock {
  id: string
  doctor_tenant_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface UserWithSchedule {
  user: SchedulableUser
  availability: AvailabilityBlock[]
}

// Server Component
export default async function SchedulesPage() {
  // Server-side authentication
  const user = await customAuth.getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check authorization - only admins
  const role = user.profile?.role
  if (role !== 'admin_tenant') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Acceso Restringido
              </h2>
              <p className="text-gray-600">
                Solo los administradores pueden acceder a esta sección.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tenantId = user.profile?.tenant_id
  if (!tenantId) {
    redirect('/auth/login')
  }

  const supabase = await createClient()

  // Get all schedulable users for this tenant
  const { data: schedulableUsers, error: usersError } = await supabase
    .from('custom_users')
    .select('id, first_name, last_name, email, role')
    .eq('tenant_id', tenantId)
    .eq('schedulable', true)
    .order('first_name')

  if (usersError) {
    console.error('Error fetching schedulable users:', usersError)
  }

  // Get doctor_tenants for mapping
  const { data: doctorTenants, error: dtError } = await supabase
    .from('doctor_tenants')
    .select('id, doctor_id')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)

  if (dtError) {
    console.error('Error fetching doctor_tenants:', dtError)
  }

  // Create a map of doctor_id to doctor_tenant_id
  const doctorTenantMap = new Map<string, string>()
  doctorTenants?.forEach(dt => {
    doctorTenantMap.set(dt.doctor_id, dt.id)
  })

  // Get all availability blocks for this tenant's users
  const doctorTenantIds = doctorTenants?.map(dt => dt.id) || []
  let availabilityBlocks: AvailabilityBlock[] = []

  if (doctorTenantIds.length > 0) {
    const { data: availability, error: availError } = await supabase
      .from('doctor_availability')
      .select('id, doctor_tenant_id, day_of_week, start_time, end_time')
      .in('doctor_tenant_id', doctorTenantIds)
      .order('day_of_week')

    if (availError) {
      console.error('Error fetching availability:', availError)
    } else {
      availabilityBlocks = availability || []
    }
  }

  // Create reverse map: doctor_tenant_id to doctor_id
  const reverseDtMap = new Map<string, string>()
  doctorTenants?.forEach(dt => {
    reverseDtMap.set(dt.id, dt.doctor_id)
  })

  // Group availability by user
  const usersWithSchedules: UserWithSchedule[] = (schedulableUsers || []).map(su => {
    const doctorTenantId = doctorTenantMap.get(su.id)
    const userAvailability = doctorTenantId
      ? availabilityBlocks.filter(ab => ab.doctor_tenant_id === doctorTenantId)
      : []

    return {
      user: su,
      availability: userAvailability
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar tenantId={tenantId} />
        <main className="flex-1 p-6">
          <SchedulesClient
            usersWithSchedules={usersWithSchedules}
            tenantId={tenantId}
          />
        </main>
      </div>
    </div>
  )
}
