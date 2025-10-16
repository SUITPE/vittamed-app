'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { BusinessType, BUSINESS_TYPE_CONFIGS } from '@/types/business'
import BusinessTypeSelector from '@/components/admin/BusinessTypeSelector'

export default function CreateTenantPage() {
  const [formData, setFormData] = useState({
    name: '',
    tenant_type: 'medical_clinic' as BusinessType,
    document: '',
    address: '',
    phone: '',
    email: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { user, loading } = useAuth()
  const router = useRouter()

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Verificando permisos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check authentication and authorization
  if (!user || (user && user.profile?.role !== 'admin_tenant')) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Acceso Restringido
              </h2>
              <p className="text-gray-600 mb-4">
                Solo los administradores pueden crear nuevos negocios.
              </p>
              <button
                onClick={() => router.push(user ? '/dashboard' : '/auth/login')}
                className="text-blue-600 hover:text-blue-500"
              >
                {user ? 'Volver al Dashboard' : 'Iniciar Sesión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al crear el negocio')
      } else {
        setSuccess(true)
        console.log('✅ Tenant created successfully:', data.tenant)
        setTimeout(() => {
          // Use window.location.href to force full page reload
          // This ensures AuthContext refreshes and gets updated user profile with tenant_id
          window.location.href = `/dashboard/${data.tenant.id}`
        }, 2000)
      }
    } catch (err) {
      setError('Error inesperado al crear el negocio')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div data-testid="create-tenant-success" className="text-center">
              <div className="text-green-500 text-4xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ¡Negocio Creado!
              </h2>
              <p className="text-gray-600 mb-4">
                El negocio ha sido creado exitosamente y has sido asignado como administrador.
              </p>
              <p className="text-sm text-gray-500">
                Redirigiendo al dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Crear Nuevo Negocio
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Registra un nuevo negocio en VittaMed
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div data-testid="create-tenant-error" className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre del Negocio *
              </label>
              <input
                id="name"
                type="text"
                data-testid="tenant-name-input"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Clínica San Rafael"
              />
            </div>

            <div>
              <label htmlFor="document" className="block text-sm font-medium text-gray-700">
                ID / Documento <span className="text-red-500">*</span>
              </label>
              <input
                id="document"
                type="text"
                data-testid="tenant-document-input"
                required
                value={formData.document}
                onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value }))}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="RUC, NIT, Tax ID, etc."
              />
            </div>

            <div>
              <label htmlFor="tenant_type" className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Negocio *
              </label>

              {/* Modern Business Type Selector with Context7 Flow */}
              <BusinessTypeSelector
                value={formData.tenant_type}
                onChange={(type) => setFormData(prev => ({ ...prev, tenant_type: type }))}
              />

              {/* Hidden input for form compatibility and tests */}
              <input
                type="hidden"
                id="tenant_type"
                data-testid="tenant-type-select"
                value={formData.tenant_type}
                readOnly
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email de Contacto
              </label>
              <input
                id="email"
                type="email"
                data-testid="tenant-email-input"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="contacto@negocio.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                data-testid="tenant-phone-input"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <textarea
                id="address"
                data-testid="tenant-address-input"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dirección completa del negocio"
              />
            </div>

            <div>
              <button
                type="submit"
                data-testid="create-tenant-submit"
                disabled={submitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? 'Creando negocio...' : 'Crear Negocio'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-xs text-gray-500">
            <p><strong>Nota:</strong> Una vez creado el negocio, serás asignado automáticamente como su administrador.</p>
          </div>
        </div>
      </div>
    </div>
  )
}