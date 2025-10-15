import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import MyAppointmentsClient from '@/components/appointments/MyAppointmentsClient'

interface Appointment {
  id: string
  service_name: string
  doctor_name: string
  tenant_name: string
  start_time: string
  end_time: string
  status: string
  price: number
  payment_status?: string
  notes?: string
  created_at: string
}

// Server Component
export default async function MyAppointmentsPage() {
  // Server-side authentication
  const user = await customAuth.getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch appointments server-side
  let appointments: Appointment[] = []
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/appointments/my-appointments`,
      {
        headers: {
          Cookie: `vittamed-auth-token=${await customAuth.getTokenFromCookie()}`
        },
        cache: 'no-store'
      }
    )

    if (response.ok) {
      appointments = await response.json()
    }
  } catch (error) {
    console.error('Error fetching appointments:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <MyAppointmentsClient initialAppointments={appointments} />
      </div>
    </div>
  )
}
