import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import SchedulesClient from '@/components/admin/SchedulesClient'
// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'


interface Schedule {
  id: string
  doctor_name: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
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
  if (role !== 'admin_tenant') {
    redirect('/auth/login')
  }

  // Mock data for schedules
  // TODO: Replace with actual API call when schedules API is implemented
  const schedules: Schedule[] = [
    {
      id: '1',
      doctor_name: 'Dr. Ana Rodríguez',
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      is_active: true
    },
    {
      id: '2',
      doctor_name: 'Dr. Ana Rodríguez',
      day_of_week: 2,
      start_time: '09:00',
      end_time: '17:00',
      is_active: true
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <SchedulesClient initialSchedules={schedules} />
      </div>
    </div>
  )
}
