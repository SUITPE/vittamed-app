'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ClientNavigation from '@/components/ClientNavigation'

interface ClientProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  date_of_birth?: string
  address?: string
  emergency_contact?: string
  emergency_phone?: string
  medical_notes?: string
  insurance_provider?: string
  insurance_number?: string
  created_at: string
  updated_at: string
}

export default function ClientProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Check if user is client
  const isClient = user?.profile?.role === 'client'

  useEffect(() => {
    if (!loading && (!user || user.profile?.role !== 'client')) {
      router.push('/auth/login')
      return
    }

    if (user && isClient) {
      fetchProfile()
    }
  }, [user, loading, router, isClient])

  async function fetchProfile() {
    try {
      setLoadingData(true)
      setError('')

      const response = await fetch(`/api/clients/${user?.id}/profile`)

      if (response.ok) {
        const profileData = await response.json()
        setProfile(profileData)
      } else {
        setError('Error al cargar el perfil')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Error de conexión al cargar el perfil')
    } finally {
      setLoadingData(false)
    }
  }

  async function updateProfile(updatedData: Partial<ClientProfile>) {
    try {
      setSaving(true)
      setError('')
      setSuccessMessage('')

      const response = await fetch(`/api/clients/${user?.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setSuccessMessage('Perfil actualizado correctamente')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        setError('Error al actualizar el perfil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Error de conexión al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profile) return

    const formData = new FormData(e.currentTarget)
    const updatedData: Partial<ClientProfile> = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      phone: formData.get('phone') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      address: formData.get('address') as string,
      emergency_contact: formData.get('emergency_contact') as string,
      emergency_phone: formData.get('emergency_phone') as string,
      medical_notes: formData.get('medical_notes') as string,
      insurance_provider: formData.get('insurance_provider') as string,
      insurance_number: formData.get('insurance_number') as string,
    }

    updateProfile(updatedData)
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

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientNavigation currentPath="/client/profile" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mi perfil...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isClient) {
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
                Solo los clientes pueden acceder a esta página.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientNavigation currentPath="/client/profile" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <p className="text-gray-600">No se pudo cargar el perfil</p>
            <button
              onClick={fetchProfile}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavigation currentPath="/client/profile" />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              👤 Mi Perfil
            </h1>
            <p className="text-gray-600 mt-1">
              Actualiza tu información personal y médica
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              {successMessage}
            </div>
          )}

          {/* Profile Overview Card */}
          <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                {profile.first_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.first_name} {profile.last_name}
                </h2>
                <p className="text-gray-600">{profile.email}</p>
                {profile.date_of_birth && (
                  <p className="text-sm text-gray-500">
                    {calculateAge(profile.date_of_birth)} años
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Información Personal
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      defaultValue={profile.first_name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      defaultValue={profile.last_name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      El email no puede ser modificado. Contacta soporte para cambios.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={profile.phone}
                      placeholder="+34 600 123 456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      defaultValue={profile.date_of_birth}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección
                    </label>
                    <textarea
                      name="address"
                      rows={2}
                      defaultValue={profile.address}
                      placeholder="Calle, Ciudad, Código Postal"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Contacto de Emergencia
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Contacto
                    </label>
                    <input
                      type="text"
                      name="emergency_contact"
                      defaultValue={profile.emergency_contact}
                      placeholder="Nombre completo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de Emergencia
                    </label>
                    <input
                      type="tel"
                      name="emergency_phone"
                      defaultValue={profile.emergency_phone}
                      placeholder="+34 600 123 456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Información Médica
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proveedor de Seguro
                    </label>
                    <input
                      type="text"
                      name="insurance_provider"
                      defaultValue={profile.insurance_provider}
                      placeholder="Nombre de la aseguradora"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Póliza
                    </label>
                    <input
                      type="text"
                      name="insurance_number"
                      defaultValue={profile.insurance_number}
                      placeholder="Número de póliza de seguro"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas Médicas
                    </label>
                    <textarea
                      name="medical_notes"
                      rows={4}
                      defaultValue={profile.medical_notes}
                      placeholder="Alergias, condiciones médicas, medicamentos actuales, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Esta información será visible para los profesionales médicos durante las consultas.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Información de Cuenta
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Miembro desde:</p>
                    <p className="text-gray-900">
                      {new Date(profile.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-700">Última actualización:</p>
                    <p className="text-gray-900">
                      {new Date(profile.updated_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}