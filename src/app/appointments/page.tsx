import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import DoctorSidebar from '@/components/DoctorSidebar'
import AdminHeader from '@/components/AdminHeader'
import AppointmentsClient from '@/components/appointments/AppointmentsClient'

interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  patient_email?: string
  patient_phone?: string
  service_name: string
  doctor_name: string
  start_time: string
  end_time: string
  status: string
  doctor_id: string
}

interface Doctor {
  id: string
  first_name: string
  last_name: string
  specialty?: string
}

// Server Component
export default async function AppointmentsPage() {
  // Server-side authentication
  const user = await customAuth.getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check authorization
  const role = user.profile?.role
  const validRoles = ['receptionist', 'admin_tenant', 'doctor', 'staff']

  if (!role || !validRoles.includes(role)) {
    redirect('/auth/login')
  }

  const currentTenantId = user.profile?.tenant_id
  if (!currentTenantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Error de Configuración
              </h2>
              <p className="text-gray-600">
                No se encontró información del tenant.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isDoctor = role === 'doctor'
  const today = new Date().toISOString().split('T')[0]

  // Fetch initial data server-side
  let appointments: Appointment[] = []
  let doctors: Doctor[] = []

  try {
    const token = await customAuth.getTokenFromCookie()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Fetch doctors if not a doctor user
    if (!isDoctor) {
      const doctorsResponse = await fetch(
        `${baseUrl}/api/tenants/${currentTenantId}/doctors`,
        {
          headers: { Cookie: `vittasami-auth-token=${token}` },
          cache: 'no-store'
        }
      )
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json()
        doctors = doctorsData.doctors || []
      }
    }

    // Fetch appointments for today
    let appointmentsUrl = `${baseUrl}/api/tenants/${currentTenantId}/appointments?date=${today}`

    // If user is doctor, only show their appointments
    if (isDoctor) {
      appointmentsUrl += `&doctor_id=${user.id}`
    }

    const appointmentsResponse = await fetch(appointmentsUrl, {
      headers: { Cookie: `vittasami-auth-token=${token}` },
      cache: 'no-store'
    })

    if (appointmentsResponse.ok) {
      const appointmentsData = await appointmentsResponse.json()
      appointments = appointmentsData.appointments || []
    }
  } catch (error) {
    console.error('Error fetching appointments data:', error)
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isDoctor && <DoctorSidebar />}
      <div className="flex-1">
        <AdminHeader />
        <div className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <AppointmentsClient
              initialAppointments={appointments}
              doctors={doctors}
              tenantId={currentTenantId}
              isDoctor={isDoctor}
              userId={user.id}
              initialDate={today}
            />
          </div>
        </div>
      </div>
    </div>
  )
}