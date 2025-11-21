import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import ManageUsersClient from '@/components/admin/ManageUsersClient'
import { UserRoleView } from '@/types/user'

// Force dynamic rendering for pages using cookies
export const dynamic = 'force-dynamic'

// Server Component - Fetches data server-side
export default async function ManageUsersPage() {
  // Server-side authentication
  const user = await customAuth.getCurrentUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check authorization
  const role = user.profile?.role
  const canManageUsers = role === 'super_admin' || role === 'admin_tenant' || role === 'staff' || role === 'receptionist'

  if (!canManageUsers) {
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
                    Solo administradores, staff y recepcionistas pueden gestionar usuarios.
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
  const isSuperAdmin = role === 'super_admin'
  const tenantName = isSuperAdmin ? 'Todos los Tenants' : 'Clínica San Rafael' // TODO: Fetch from DB

  // Only check for tenant_id if not super_admin
  if (!tenantId && !isSuperAdmin) {
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

  // Fetch users server-side
  let users: UserRoleView[] = []

  try {
    // Super admin fetches ALL users, others fetch only their tenant's users
    const apiUrl = isSuperAdmin
      ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/users`
      : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tenants/${tenantId}/users`

    console.log('[ManageUsers] Fetching users:', {
      role,
      isSuperAdmin,
      tenantId,
      apiUrl
    })

    const response = await fetch(apiUrl, {
      headers: {
        Cookie: `vittasami-auth-token=${await customAuth.getTokenFromCookie()}`
      },
      cache: 'no-store' // Always fetch fresh data
    })

    console.log('[ManageUsers] Fetch response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (response.ok) {
      const data = await response.json()
      users = data.users || []
      console.log('[ManageUsers] Users fetched:', {
        count: users.length,
        users: users.map(u => ({ email: u.email, role: u.role }))
      })
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[ManageUsers] Failed to fetch users:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
    }
  } catch (error) {
    console.error('[ManageUsers] Error fetching users:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar tenantId={tenantId} />
      <AdminHeader />
      <div className="md:ml-64 pt-16">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <ManageUsersClient
              initialUsers={users}
              tenantId={tenantId}
              tenantName={tenantName}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
