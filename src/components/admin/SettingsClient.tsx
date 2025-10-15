'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BUSINESS_TYPE_CONFIGS, BusinessType } from '@/types/business'

interface TenantSettings {
  id: string
  name: string
  tenant_type: BusinessType
  address: string
  phone: string
  email: string
}

interface SettingsClientProps {
  tenantData: TenantSettings
  tenantId: string
}

export default function SettingsClient({ tenantData, tenantId }: SettingsClientProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: tenantData.name || '',
    tenant_type: tenantData.tenant_type || ('clinic' as BusinessType),
    address: tenantData.address || '',
    phone: tenantData.phone || '',
    email: tenantData.email || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSuccess('Configuración actualizada exitosamente')
        router.refresh() // Re-fetch server data
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

  return (
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
  )
}
