import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import { createClient } from '@/lib/supabase-server'
import MyAppointmentsClient from '@/components/appointments/MyAppointmentsClient'

// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'

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

  const supabase = await createClient()

  // Fetch appointments directly from Supabase
  let appointments: Appointment[] = []
  try {
    const { data: appointmentsData, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        total_amount,
        payment_status,
        notes,
        created_at,
        services!inner(name),
        doctors!inner(first_name, last_name),
        tenants!inner(name)
      `)
      .eq('patient_id', user.id)
      .order('start_time', { ascending: false })

    if (error) {
      console.error('[MyAppointments] Error fetching appointments:', error)
    } else if (appointmentsData) {
      appointments = appointmentsData.map((appointment: any) => ({
        id: appointment.id,
        service_name: appointment.services?.name,
        doctor_name: `${appointment.doctors?.first_name} ${appointment.doctors?.last_name}`,
        tenant_name: appointment.tenants?.name,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
        price: appointment.total_amount,
        payment_status: appointment.payment_status,
        notes: appointment.notes,
        created_at: appointment.created_at
      }))
      console.log('[MyAppointments] Appointments fetched:', {
        count: appointments.length,
        patientId: user.id
      })
    }
  } catch (error) {
    console.error('[MyAppointments] Error fetching appointments:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <MyAppointmentsClient initialAppointments={appointments} />
      </div>
    </div>
  )
}
