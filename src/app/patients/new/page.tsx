import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import NewPatientForm from '@/components/patients/NewPatientForm'

// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'

// Server Component - Only auth check
export default async function NewPatientPage() {
  // Server-side authentication
  const user = await customAuth.getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check authorization
  const role = user.profile?.role
  const canCreatePatient = role === 'admin_tenant' || role === 'staff' || role === 'receptionist'

  if (!canCreatePatient) {
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
                No tienes permisos para crear pacientes.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <NewPatientForm />
}
