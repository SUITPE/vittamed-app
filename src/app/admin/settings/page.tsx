import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import { createClient } from '@/lib/supabase-server'
import AdminNavigation from '@/components/AdminNavigation'
import SettingsClient from '@/components/admin/SettingsClient'
import { BusinessType } from '@/types/business'
// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'


interface TenantSettings {
  id: string
  name: string
  tenant_type: BusinessType
  address: string
  phone: string
  email: string
}

// Server Component
export default async function SettingsPage() {
  // Server-side authentication
  const user = await customAuth.getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check authorization - only admins
  const role = user.profile?.role
  if (role !== 'admin_tenant') {
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
                Solo los administradores pueden acceder a la configuración.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentTenantId = user.profile?.tenant_id

  if (!currentTenantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
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
    )
  }

  const supabase = await createClient()

  // Fetch tenant settings directly from Supabase
  let tenantData: TenantSettings | null = null

  try {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, tenant_type, address, phone, email')
      .eq('id', currentTenantId)
      .single()

    if (tenantError) {
      console.error('[Settings] Error fetching tenant settings:', tenantError)
    } else if (tenant) {
      tenantData = tenant
      console.log('[Settings] Tenant fetched:', { tenantId: tenant.id, name: tenant.name })
    }
  } catch (error) {
    console.error('[Settings] Error fetching tenant settings:', error)
  }

  if (!tenantData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation currentPath="/admin/settings" tenantId={currentTenantId} />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              No se encontró la información del negocio
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation currentPath="/admin/settings" tenantId={currentTenantId} />
      <div className="p-6">
        <SettingsClient tenantData={tenantData} tenantId={currentTenantId} />
      </div>
    </div>
  )
}
