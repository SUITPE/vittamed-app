'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AdminNavigation from '@/components/AdminNavigation'
import { BUSINESS_TYPE_CONFIGS, BusinessType } from '@/types/business'

interface TenantSettings {
  id: string
  name: string
  tenant_type: BusinessType
  address: string
  phone: string
  email: string
  business_settings?: any
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const [tenantData, setTenantData] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    tenant_type: 'clinic' as BusinessType,
    address: '',
    phone: '',
    email: ''
  })

  // Check if user is admin
  const isAdmin = () => user?.profile?.role === 'admin_tenant'
  const currentTenantId = user?.profile?.tenant_id

  useEffect(() => {
    if (user && isAdmin() && currentTenantId) {
      fetchTenantSettings()
    }
  }, [user, currentTenantId])

  const fetchTenantSettings = async () => {
    if (!currentTenantId) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/tenants')

      if (response.ok) {
        const tenants = await response.json()
        const currentTenant = tenants.find((t: any) => t.id === currentTenantId)

        if (currentTenant) {
          setTenantData(currentTenant)
          setFormData({
            name: currentTenant.name || '',
            tenant_type: currentTenant.tenant_type || 'clinic',
            address: currentTenant.address || '',
            phone: currentTenant.phone || '',
            email: currentTenant.email || ''
          })
        } else {
          setError('No se encontró la información del negocio')
        }
      } else {
        setError('Error al cargar configuración del negocio')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error fetching tenant settings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTenantId) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/tenants/${currentTenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSuccess('Configuración actualizada exitosamente')
        await fetchTenantSettings()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al actualizar configuración')
      }
    } catch (err) {
      setError('Error al actualizar configuración')
      console.error('Error updating tenant settings:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAdmin()) {
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavigation currentPath="/admin/settings" tenantId={currentTenantId || undefined} />
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando configuración...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation currentPath="/admin/settings" tenantId={currentTenantId || undefined} />

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ⚙️ Configuración del Negocio
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Actualiza la información general de tu negocio
                </p>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              </div>
            )}

            {success && (
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                  {success}
                </div>
              </div>
            )}

            {/* Settings Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Business Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre del Negocio *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Clínica San Rafael"
                />
              </div>

              {/* Business Type */}
              <div>
                <label htmlFor="tenant_type" className="block text-sm font-medium text-gray-700">
                  Tipo de Negocio *
                </label>
                <select
                  id="tenant_type"
                  value={formData.tenant_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, tenant_type: e.target.value as BusinessType }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <optgroup label="🏥 Especialidades Médicas">
                    <option value="medical_clinic">🏥 Clínica Médica General</option>
                    <option value="dental_clinic">🦷 Clínica Dental</option>
                    <option value="pediatric_clinic">👶 Clínica Pediátrica</option>
                    <option value="physiotherapy_clinic">🏃‍♂️ Centro de Fisioterapia</option>
                    <option value="psychology_clinic">🧠 Consulta Psicológica</option>
                    <option value="aesthetic_clinic">✨ Clínica Estética</option>
                  </optgroup>
                  <optgroup label="🧘‍♀️ Bienestar y Relajación">
                    <option value="wellness_spa">🧘‍♀️ Spa de Bienestar</option>
                    <option value="massage_center">👐 Centro de Masajes</option>
                  </optgroup>
                  <optgroup label="💇‍♀️ Belleza y Estética">
                    <option value="beauty_salon">💇‍♀️ Salón de Belleza</option>
                  </optgroup>
                  <optgroup label="🔬 Centros Especializados">
                    <option value="rehabilitation_center">🦽 Centro de Rehabilitación</option>
                    <option value="diagnostic_center">🔬 Centro de Diagnóstico</option>
                  </optgroup>
                  <optgroup label="🐕 Veterinaria">
                    <option value="veterinary_clinic">🐕 Clínica Veterinaria</option>
                  </optgroup>
                  <optgroup label="Legacy">
                    <option value="clinic">Clínica General</option>
                    <option value="spa">Spa</option>
                    <option value="consultorio">Consultorio Privado</option>
                  </optgroup>
                </select>

                {/* Business Type Info */}
                {formData.tenant_type && BUSINESS_TYPE_CONFIGS[formData.tenant_type] && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start">
                      <div className="text-2xl mr-3">
                        {BUSINESS_TYPE_CONFIGS[formData.tenant_type].icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {BUSINESS_TYPE_CONFIGS[formData.tenant_type].label}
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          {BUSINESS_TYPE_CONFIGS[formData.tenant_type].description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contacto@negocio.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Dirección
                </label>
                <textarea
                  id="address"
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección completa del negocio"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Actualizando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Additional Settings Sections */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Configuraciones Avanzadas
              </h2>
              <p className="text-sm text-gray-600">
                Próximamente: Horarios, notificaciones, integraciones
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">📅</div>
                    <div>
                      <h3 className="font-medium text-gray-900">Horarios</h3>
                      <p className="text-sm text-gray-500">Configurar horarios de atención</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">🔔</div>
                    <div>
                      <h3 className="font-medium text-gray-900">Notificaciones</h3>
                      <p className="text-sm text-gray-500">Email y WhatsApp automático</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-2xl mr-3">💳</div>
                    <div>
                      <h3 className="font-medium text-gray-900">Pagos</h3>
                      <p className="text-sm text-gray-500">Configurar métodos de pago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}