'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'
import AdminSidebar from '@/components/AdminSidebar'
import { Icons } from '@/components/ui/Icons'
import { Skeleton, SkeletonCard, SkeletonForm } from '@/components/ui/Skeleton'
import { Avatar } from '@/components/ui/Avatar'

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
  avatar_url?: string
  created_at: string
  updated_at: string
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    address: ''
  })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
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
      setAvatarUrl(user.profile.avatar_url ?? null)
    }
  }, [user, authLoading, router])

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al subir la imagen')
      } else {
        setAvatarUrl(data.avatar_url)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError('Error inesperado al subir la imagen')
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle avatar delete
  const handleAvatarDelete = async () => {
    if (!avatarUrl) return

    setError('')
    setUploadingAvatar(true)

    try {
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al eliminar la imagen')
      } else {
        setAvatarUrl(null)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err) {
      setError('Error inesperado al eliminar la imagen')
    } finally {
      setUploadingAvatar(false)
    }
  }

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
      <div className="min-h-screen bg-gray-50">
        <div className="pt-16 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-5 w-56" />
            </div>
            {/* Profile Overview Skeleton */}
            <SkeletonCard className="p-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              </div>
            </SkeletonCard>
            {/* Form Skeleton */}
            <SkeletonForm />
          </div>
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
            <div className="flex items-start space-x-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <Avatar
                    src={avatarUrl}
                    firstName={user.profile?.first_name ?? undefined}
                    lastName={user.profile?.last_name ?? undefined}
                    size="2xl"
                    className="ring-4 ring-gray-100"
                  />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="px-3 py-1.5 text-sm font-medium text-[#40C9C6] border border-[#40C9C6] rounded-md hover:bg-[#40C9C6]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {avatarUrl ? 'Cambiar' : 'Subir foto'}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleAvatarDelete}
                      disabled={uploadingAvatar}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  JPG, PNG, WebP o GIF. Máx 5MB
                </p>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.profile?.first_name || 'Usuario'} {user.profile?.last_name || ''}
                </h2>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#40C9C6]/10 text-[#40C9C6]">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#40C9C6] focus:border-[#40C9C6]"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#40C9C6] focus:border-[#40C9C6]"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#40C9C6] focus:border-[#40C9C6]"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#40C9C6] focus:border-[#40C9C6]"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#40C9C6] focus:border-[#40C9C6]"
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
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#40C9C6] focus:ring-offset-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-[#40C9C6] text-white rounded-md hover:bg-[#33a19e] focus:outline-none focus:ring-2 focus:ring-[#40C9C6] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
