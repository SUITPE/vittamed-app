import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import { createClient } from '@/lib/supabase-server'
import DoctorSidebar from '@/components/DoctorSidebar'
import AdminHeader from '@/components/AdminHeader'
import AppointmentsClient from '@/components/appointments/AppointmentsClient'

// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'

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
  const supabase = await createClient()

  // Fetch initial data directly from Supabase
  let appointments: Appointment[] = []
  let doctors: Doctor[] = []

  try {
    // Fetch all schedulable users (not just doctors) if not a doctor user
    if (!isDoctor) {
      const { data: schedulableUsers, error: doctorsError } = await supabase
        .from('custom_users')
        .select(`
          id,
          first_name,
          last_name,
          role
        `)
        .eq('tenant_id', currentTenantId)
        .eq('schedulable', true)
        .eq('is_active', true)

      if (doctorsError) {
        console.error('[Appointments] Error fetching schedulable users:', doctorsError)
      } else if (schedulableUsers) {
        doctors = schedulableUsers.map((user: any) => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          specialty: undefined // No specialty field in custom_users
        }))
        console.log('[Appointments] Schedulable users fetched:', { count: doctors.length })
      }
    }

    // Build query for appointments
    let query = supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        service_id,
        doctor_id,
        patient_id,
        patients (
          first_name,
          last_name,
          email,
          phone
        ),
        services (
          name
        ),
        doctors (
          first_name,
          last_name
        )
      `)
      .eq('tenant_id', currentTenantId)
      .eq('appointment_date', today)

    // If user is doctor, only show their appointments
    if (isDoctor) {
      query = query.eq('doctor_id', user.id)
    }

    const { data: appointmentsData, error: appointmentsError } = await query
      .order('appointment_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (appointmentsError) {
      console.error('[Appointments] Error fetching appointments:', appointmentsError)
    } else if (appointmentsData) {
      appointments = appointmentsData.map((appointment: any) => ({
        id: appointment.id,
        patient_id: appointment.patient_id,
        patient_name: appointment.patients
          ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
          : 'Paciente no especificado',
        patient_email: appointment.patients?.email,
        patient_phone: appointment.patients?.phone,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
        service_name: appointment.services?.name || 'Servicio no especificado',
        doctor_name: appointment.doctors
          ? `${appointment.doctors.first_name} ${appointment.doctors.last_name}`
          : 'Doctor no asignado',
        doctor_id: appointment.doctor_id
      }))
      console.log('[Appointments] Appointments fetched:', {
        count: appointments.length,
        tenantId: currentTenantId,
        date: today,
        isDoctor,
        doctorId: isDoctor ? user.id : undefined
      })
    }
  } catch (error) {
    console.error('[Appointments] Error fetching appointments data:', error)
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