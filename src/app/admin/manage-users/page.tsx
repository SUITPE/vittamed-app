'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRoleView, AddUserToTenantRequest, getRoleDisplayName, getRoleColor, isValidUserRole } from '@/types/user'
import AddTeamMemberModal from '@/components/AddTeamMemberModal'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'

export default function ManageUsersPage() {
  const { user, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserRoleView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)

  // Allow admin_tenant, staff, and receptionist roles to manage users
  const canManageUsers = () => {
    const role = user?.profile?.role
    return role === 'admin_tenant' || role === 'staff' || role === 'receptionist'
  }
  const currentTenant = {
    tenant_id: user?.profile?.tenant_id || '',
    tenant_name: 'Clínica San Rafael' // Default for demo
  }

  // Fetch tenant users
  const fetchTenantUsers = async () => {
    if (!currentTenant?.tenant_id) return

    try {
      setLoading(true)
      setError('')
      const response = await fetch(`/api/tenants/${currentTenant.tenant_id}/users`)

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Network error while fetching users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const tenantId = user?.profile?.tenant_id
    if (!authLoading && tenantId && canManageUsers()) {
      fetchTenantUsers()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user?.profile?.tenant_id, authLoading])

  const handleMemberAdded = (member: UserRoleView) => {
    // Refresh the users list
    fetchTenantUsers()
    setShowAddMemberModal(false)
  }

  // Check access
  if (!authLoading && !canManageUsers()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar tenantId={currentTenant.tenant_id} />
        <AdminHeader />
        <div className="ml-64 pt-16">
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

  const handleToggleSchedulable = async (userId: string, currentSchedulable: boolean) => {
    if (!currentTenant?.tenant_id) return

    try {
      const response = await fetch(`/api/tenants/${currentTenant.tenant_id}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedulable: !currentSchedulable
        })
      })

      if (response.ok) {
        await fetchTenantUsers()
        setError('') // Clear any previous errors
      } else {
        const errorData = await response.json()
        if (errorData.migration_required) {
          setError(`⚠️ Migración requerida: ${errorData.error}`)
        } else {
          setError(errorData.error || 'Failed to update user')
        }
      }
    } catch (err) {
      setError('Error updating user')
      console.error('Error updating user:', err)
    }
  }

  const handleRemoveUser = async (userId: string, userName: string) => {
    if (!currentTenant?.tenant_id) return

    if (!confirm(`¿Estás seguro de que deseas remover a ${userName} de este negocio?`)) {
      return
    }

    try {
      const response = await fetch(`/api/tenants/${currentTenant.tenant_id}/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchTenantUsers()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to remove user')
      }
    } catch (err) {
      setError('Error removing user from tenant')
      console.error('Error removing user:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar tenantId={currentTenant.tenant_id} />
        <AdminHeader />
        <div className="ml-64 pt-16">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando usuarios...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar tenantId={currentTenant.tenant_id} />
      <AdminHeader />
      <div className="ml-64 pt-16">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white shadow rounded-lg">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Gestión de Usuarios
                    </h1>
                    <p className="mt-1 text-sm text-gray-600">
                      Administra los usuarios de {currentTenant?.tenant_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Agregar Miembro
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                    {error}
                  </div>
                </div>
              )}

              {/* Users List */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agendable
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asignado
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.user_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleDisplayName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleSchedulable(user.user_id, user.schedulable || false)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                              user.schedulable
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                            title="Click para cambiar"
                          >
                            {user.schedulable ? 'Sí' : 'No'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.role_assigned_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {user.role !== 'admin_tenant' && (
                            <button
                              onClick={() => handleRemoveUser(user.user_id, user.first_name || user.email)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remover
                            </button>
                          )}
                          {user.role === 'admin_tenant' && (
                            <span className="text-gray-400 text-sm">Protegido</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {users.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg mb-4">No hay miembros del equipo</div>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Agregar el primer miembro
                  </button>
                </div>
              )}
            </div>

            {/* Add Team Member Modal */}
            <AddTeamMemberModal
              isOpen={showAddMemberModal}
              onClose={() => setShowAddMemberModal(false)}
              onSuccess={handleMemberAdded}
              tenantId={currentTenant?.tenant_id || ''}
              tenantName={currentTenant?.tenant_name || ''}
            />
          </div>
        </div>
      </div>
    </div>
  )
}