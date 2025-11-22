import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import { createClient } from '@/lib/supabase-server'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import PatientsClient from '@/components/patients/PatientsClient'
// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'


interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
  document: string
  phone?: string
  date_of_birth?: string
  address?: string
  medical_history?: string
  is_active: boolean
  created_at: string
}

// Server Component
export default async function PatientsPage() {
  // Server-side authentication
  const user = await customAuth.getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check authorization
  const role = user.profile?.role
  const isReceptionist = role === 'receptionist'
  const isAdmin = role === 'admin_tenant'
  const isStaff = role === 'staff'
  const canManagePatients = isReceptionist || isAdmin || isStaff

  if (!canManagePatients) {
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
                Solo administradores y recepcionistas pueden gestionar pacientes.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentTenantId = user.profile?.tenant_id
  const supabase = await createClient()

  // Fetch tenant info directly from Supabase
  let tenantName = 'Cargando...'
  try {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', currentTenantId)
      .single()

    if (tenantError) {
      console.error('[Patients] Error fetching tenant:', tenantError)
    } else if (tenant) {
      tenantName = tenant.name
    }
  } catch (error) {
    console.warn('[Patients] Failed to fetch tenant info:', error)
  }

  // Fetch patients directly from Supabase
  let patients: Patient[] = []
  try {
    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .eq('tenant_id', currentTenantId)
      .order('created_at', { ascending: false })

    if (patientsError) {
      console.error('[Patients] Error fetching patients:', patientsError)
    } else {
      patients = patientsData || []
      console.log('[Patients] Patients fetched:', {
        count: patients.length,
        tenantId: currentTenantId
      })
    }
  } catch (error) {
    console.error('[Patients] Error fetching patients:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar tenantId={currentTenantId || undefined} />
      <AdminHeader />
      <div className="md:ml-64 pt-16">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <PatientsClient
              initialPatients={patients}
              tenantName={tenantName}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
