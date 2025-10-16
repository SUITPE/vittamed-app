import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import PatientsClient from '@/components/patients/PatientsClient'

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

  // Fetch tenant info server-side
  let tenantName = 'Cargando...'
  try {
    const tenantResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tenants`,
      {
        headers: {
          Cookie: `vittasami-auth-token=${await customAuth.getTokenFromCookie()}`
        },
        cache: 'no-store'
      }
    )
    if (tenantResponse.ok) {
      const tenants = await tenantResponse.json()
      const tenant = tenants.find((t: any) => t.id === currentTenantId)
      if (tenant) {
        tenantName = tenant.name
      }
    }
  } catch (error) {
    console.warn('Failed to fetch tenant info')
  }

  // Fetch patients server-side
  let patients: Patient[] = []
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/patients`,
      {
        headers: {
          Cookie: `vittasami-auth-token=${await customAuth.getTokenFromCookie()}`
        },
        cache: 'no-store'
      }
    )

    if (response.ok) {
      patients = await response.json()
    }
  } catch (error) {
    console.error('Error fetching patients:', error)
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
