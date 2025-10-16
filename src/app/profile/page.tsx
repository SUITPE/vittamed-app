'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'
import AdminSidebar from '@/components/AdminSidebar'
import { Icons } from '@/components/ui/Icons'

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  tenant_id?: string
  phone?: string
  date_of_birth?: string
  address?: string
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    address: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user && user.profile) {
      // Ensure all values are strings (never undefined)
      setFormData({
        first_name: user.profile.first_name ?? '',
        last_name: user.profile.last_name ?? '',
        phone: user.profile.phone ?? '',
        date_of_birth: user.profile.date_of_birth ?? '',
        address: user.profile.address ?? ''
      })
    }
  }, [user, authLoading, router])

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin_tenant':
        return 'Administrador'
      case 'staff':
        return 'Staff'
      case 'receptionist':
        return 'Recepcionista'
      case 'doctor':
        return 'Doctor'
      case 'patient':
        return 'Paciente'
      default:
        return role || 'Usuario'
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || 'U'
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      const response = await fetch(`/api/users/${user?.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al actualizar el perfil')
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
        // Refresh user data
        window.location.reload()
      }
    } catch (err) {
      setError('Error inesperado al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user.profile?.tenant_id && <AdminSidebar tenantId={user.profile.tenant_id} />}
      <AdminHeader />

      <div className={`${user.profile?.tenant_id ? 'md:ml-64' : ''} pt-16 p-6`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Mi Perfil
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona tu información personal
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              ✓ Perfil actualizado correctamente
            </div>
          )}

          {/* Profile Overview Card */}
          <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(user.profile?.first_name, user.profile?.last_name)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.profile?.first_name || 'Usuario'} {user.profile?.last_name || ''}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {getRoleLabel(user.profile?.role)}
                  </span>
                  {formData.date_of_birth && (
                    <span className="text-sm text-gray-500">
                      {calculateAge(formData.date_of_birth)} años
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Información Personal
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      El email no puede ser modificado
                    </p>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+51 999 999 999"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <textarea
                      id="address"
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Calle, Ciudad, Código Postal"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Información de Cuenta
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Icons.user className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">ID de Usuario</p>
                    </div>
                    <p className="text-sm text-gray-900 font-mono">{user.id}</p>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Icons.calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">Miembro desde</p>
                    </div>
                    <p className="text-sm text-gray-900">
                      {user.profile?.created_at ? new Date(user.profile.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>

                  {user.profile?.tenant_id && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Icons.building className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">Negocio</p>
                      </div>
                      <p className="text-sm text-gray-900 font-mono">{user.profile.tenant_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Icons.check className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
