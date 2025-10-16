import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import ServicesManagementClient from '@/components/admin/ServicesManagementClient'

interface Service {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number
  is_active: boolean
  tenant_id: string
  category_id: string | null
  created_at: string
  category?: {
    id: string
    name: string
  }
}

interface ServiceCategory {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

// Server Component - Fetches data server-side
export default async function ServicesPage() {
  // Server-side authentication
  const user = await customAuth.getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check authorization
  const role = user.profile?.role
  const isAuthorized = role === 'admin_tenant' || role === 'staff' || role === 'receptionist'

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar tenantId={user.profile?.tenant_id || undefined} />
        <AdminHeader />
        <div className="md:ml-64 pt-16">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <div className="text-center">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Acceso Restringido
                  </h2>
                  <p className="text-gray-600">
                    Solo el personal administrativo puede gestionar servicios.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tenantId = user.profile?.tenant_id

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar tenantId={undefined} />
        <AdminHeader />
        <div className="md:ml-64 pt-16">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <div className="text-center">
                  <div className="text-yellow-500 text-4xl mb-4">⚠️</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Tenant No Configurado
                  </h2>
                  <p className="text-gray-600">
                    Tu cuenta no está asociada a ningún tenant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fetch services server-side
  let services: Service[] = []
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tenants/${tenantId}/services`,
      {
        headers: {
          Cookie: `vittamed-auth-token=${await customAuth.getTokenFromCookie()}`
        },
        cache: 'no-store' // Always fetch fresh data
      }
    )

    if (response.ok) {
      const data = await response.json()
      services = data.services || []
    }
  } catch (error) {
    console.error('Error fetching services server-side:', error)
  }

  // Fetch categories server-side (tenant-specific)
  let categories: ServiceCategory[] = []
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tenants/${tenantId}/categories?is_active=true`,
      {
        headers: {
          Cookie: `vittamed-auth-token=${await customAuth.getTokenFromCookie()}`
        },
        cache: 'no-store' // Always fetch fresh data
      }
    )

    if (response.ok) {
      const data = await response.json()
      categories = data || []
    }
  } catch (error) {
    console.error('Error fetching categories server-side:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar tenantId={tenantId} />
      <AdminHeader />
      <div className="md:ml-64 pt-16">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <ServicesManagementClient
              initialServices={services}
              initialCategories={categories}
              tenantId={tenantId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
