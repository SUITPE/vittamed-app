import { redirect } from 'next/navigation'
import { customAuth } from '@/lib/custom-auth'
import { createClient } from '@/lib/supabase-server'
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

  const isSuperAdmin = role === 'super_admin'
  // For super_admin, use empty string as tenant_id (they see all users)
  const rawTenantId = user.profile?.tenant_id
  const tenantId: string = rawTenantId || (isSuperAdmin ? '' : '')
  const tenantName = isSuperAdmin ? 'Todos los Tenants' : 'Clínica San Rafael' // TODO: Fetch from DB

  // Only check for tenant_id if not super_admin
  if (!rawTenantId && !isSuperAdmin) {
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

  // Fetch users server-side directly from Supabase
  let users: UserRoleView[] = []

  try {
    const supabase = await createClient()

    console.log('[ManageUsers] Fetching users:', {
      role,
      isSuperAdmin,
      tenantId
    })

    if (isSuperAdmin) {
      // Super admin: fetch ALL users from user_role_view
      const { data: allUsers, error: usersError } = await supabase
        .from('user_role_view')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) {
        console.error('[ManageUsers] Error fetching all users:', usersError)
      } else {
        users = allUsers || []
      }
    } else {
      // Regular admin: fetch only tenant's users from custom_users
      const { data: tenantUsers, error: usersError } = await supabase
        .from('custom_users')
        .select(`
          id,
          email,
          first_name,
          last_name,
          role,
          tenant_id,
          schedulable,
          created_at,
          updated_at
        `)
        .eq('tenant_id', tenantId)

      if (usersError) {
        console.error('[ManageUsers] Error fetching tenant users:', usersError)
      } else {
        // Transform to match UserRoleView format
        users = (tenantUsers || []).map(user => {
          const schedulable = user.schedulable !== undefined
            ? user.schedulable
            : (user.role === 'doctor' || user.role === 'member')

          return {
            user_id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            tenant_id: user.tenant_id,
            tenant_name: '',
            tenant_type: '',
            role: user.role,
            is_active: true,
            schedulable,
            doctor_id: undefined,
            doctor_first_name: undefined,
            doctor_last_name: undefined,
            is_current_tenant: user.tenant_id === tenantId,
            role_assigned_at: user.created_at
          }
        })
      }
    }

    console.log('[ManageUsers] Users fetched:', {
      count: users.length,
      users: users.map(u => ({ email: u.email, role: u.role }))
    })
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
