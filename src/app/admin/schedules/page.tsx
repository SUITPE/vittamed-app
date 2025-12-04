import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import { createClient } from '@/lib/supabase-server'
import SchedulesClient from '@/components/admin/SchedulesClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'

// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'

interface Schedule {
  id: string
  doctor_id: string
  doctor_name: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface Doctor {
  id: string
  name: string
}

// Server Component
export default async function SchedulesPage() {
  // Server-side authentication
  const user = await customAuth.getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check authorization
  const role = user.profile?.role
  if (role !== 'admin_tenant' && role !== 'staff' && role !== 'receptionist') {
    redirect('/auth/login')
  }

  const tenantId = user.profile?.tenant_id

  let schedules: Schedule[] = []
  let doctors: Doctor[] = []

  if (tenantId) {
    try {
      const supabase = await createClient()

      // Get all doctor_tenant IDs for this tenant
      const { data: doctorTenants, error: doctorError } = await supabase
        .from('doctor_tenants')
        .select('id, doctor_id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)

      if (!doctorError && doctorTenants && doctorTenants.length > 0) {
        const doctorTenantIds = doctorTenants.map(dt => dt.id)
        const doctorIds = doctorTenants.map(dt => dt.doctor_id)

        // Get doctor profiles
        const { data: doctorProfiles } = await supabase
          .from('custom_users')
          .select('id, first_name, last_name')
          .in('id', doctorIds)

        // Create maps
        const doctorMap = new Map<string, string>()
        doctorProfiles?.forEach(doc => {
          doctorMap.set(doc.id, `Dr. ${doc.first_name} ${doc.last_name}`)
        })

        const doctorTenantToDoctor = new Map<string, string>()
        doctorTenants.forEach(dt => {
          doctorTenantToDoctor.set(dt.id, dt.doctor_id)
        })

        // Get availability
        const { data: availability } = await supabase
          .from('doctor_availability')
          .select('id, doctor_tenant_id, day_of_week, start_time, end_time')
          .in('doctor_tenant_id', doctorTenantIds)
          .order('day_of_week', { ascending: true })

        schedules = availability?.map(av => {
          const doctorId = doctorTenantToDoctor.get(av.doctor_tenant_id) || ''
          const doctorName = doctorMap.get(doctorId) || 'Doctor'
          return {
            id: av.id,
            doctor_id: doctorId,
            doctor_name: doctorName,
            day_of_week: av.day_of_week,
            start_time: av.start_time,
            end_time: av.end_time,
            is_active: true
          }
        }) || []

        doctors = doctorProfiles?.map(doc => ({
          id: doc.id,
          name: `Dr. ${doc.first_name} ${doc.last_name}`
        })) || []
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar tenantId={tenantId || undefined} />
      <div className="flex-1">
        <AdminHeader />
        <div className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <SchedulesClient
              initialSchedules={schedules}
              doctors={doctors}
              tenantId={tenantId || ''}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
