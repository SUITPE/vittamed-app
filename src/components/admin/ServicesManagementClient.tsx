'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Service {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number
  is_active: boolean
  tenant_id: string
  category_id: string | null
  created_at: string
  category?: {
    id: string
    name: string
  }
}

interface ServiceCategory {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

interface ServicesManagementClientProps {
  initialServices: Service[]
  initialCategories: ServiceCategory[]
  tenantId: string
}

export default function ServicesManagementClient({
  initialServices,
  initialCategories,
  tenantId
}: ServicesManagementClientProps) {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>(initialServices)
  const [categories, setCategories] = useState<ServiceCategory[]>(initialCategories)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services')
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showQuickCategoryModal, setShowQuickCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  })
  const [quickCategoryName, setQuickCategoryName] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    category_id: '',
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)

  const refreshData = async () => {
    try {
      // Fetch fresh data from server
      const [servicesRes, categoriesRes] = await Promise.all([
        fetch(`/api/tenants/${tenantId}/services`, { cache: 'no-store' }),
        fetch(`/api/tenants/${tenantId}/categories?is_active=true`, { cache: 'no-store' })
      ])

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json()
        setServices(servicesData.services || [])
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData || [])
      }

      // Also trigger server component refresh
      router.refresh()
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/tenants/${tenantId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setFormData({
          name: '',
          description: '',
          duration_minutes: 60,
          price: 0,
          category_id: '',
          is_active: true
        })
        setShowAddModal(false)

        // Refresh from server to get accurate data
        await refreshData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al crear servicio')
      }
    } catch (err) {
      setError('Error al crear servicio')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (response.ok) {
        // Refresh from server to get accurate data
        await refreshData()
      } else {
        setError('Error al actualizar servicio')
      }
    } catch (err) {
      setError('Error al actualizar servicio')
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price,
      category_id: service.category_id || '',
      is_active: service.is_active
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingService) return

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/tenants/${tenantId}/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowEditModal(false)
        setEditingService(null)
        setFormData({
          name: '',
          description: '',
          duration_minutes: 60,
          price: 0,
          category_id: '',
          is_active: true
        })

        // Refresh from server to get accurate data
        await refreshData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al actualizar servicio')
      }
    } catch (err) {
      setError('Error al actualizar servicio')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteService = async (serviceId: string, serviceName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar "${serviceName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/tenants/${tenantId}/services/${serviceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh from server to get accurate data
        await refreshData()
      } else {
        setError('Error al eliminar servicio')
      }
    } catch (err) {
      setError('Error al eliminar servicio')
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const url = editingCategory
        ? `/api/catalog/service-categories/${editingCategory.id}`
        : `/api/tenants/${tenantId}/categories`

      const response = await fetch(url, {
        method: editingCategory ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryFormData,
          tenant_id: tenantId // Always include tenant_id
        })
      })

      if (response.ok) {
        // Close modal and reset form
        setCategoryFormData({ name: '', description: '' })
        setShowCategoryModal(false)
        setEditingCategory(null)

        // Refresh from server to get accurate data
        await refreshData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al guardar categoría')
      }
    } catch (err) {
      setError('Error al guardar categoría')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category)
    setCategoryFormData({
      name: category.name,
      description: category.description || ''
    })
    setShowCategoryModal(true)
  }

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${categoryName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/catalog/service-categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Clear the category from form if selected
        if (formData.category_id === categoryId) {
          setFormData(prev => ({ ...prev, category_id: '' }))
        }

        // Refresh from server to get accurate data
        await refreshData()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al eliminar categoría')
      }
    } catch (err) {
      setError('Error al eliminar categoría')
    }
  }

  const handleQuickCategoryCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/tenants/${tenantId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickCategoryName.trim(),
          description: null,
          tenant_id: tenantId
        })
      })

      if (response.ok) {
        const newCategory = await response.json()

        // Close modal and reset
        setQuickCategoryName('')
        setShowQuickCategoryModal(false)

        // Refresh from server to get accurate data
        await refreshData()

        // Auto-select the new category in the form (after refresh)
        setFormData(prev => ({ ...prev, category_id: newCategory.id }))
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al crear categoría')
      }
    } catch (err) {
      setError('Error al crear categoría')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab === 'services' ? '🏥 Gestión de Servicios' : '📁 Categorías de Servicios'}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {activeTab === 'services'
                  ? 'Administra los servicios ofrecidos en tu negocio'
                  : 'Organiza tus servicios en categorías'}
              </p>
            </div>
            <button
              onClick={() => activeTab === 'services' ? setShowAddModal(true) : setShowCategoryModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {activeTab === 'services' ? 'Agregar Servicio' : 'Agregar Categoría'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('services')}
              className={`${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Servicios
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Categorías
            </button>
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          </div>
        )}

        {/* Services List */}
        {activeTab === 'services' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className={!service.is_active ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {service.name}
                        </div>
                        {service.description && (
                          <div className="text-sm text-gray-500">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.duration_minutes} min
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${service.price}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {service.category?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {service.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleServiceStatus(service.id, service.is_active)}
                        className={`text-sm ${
                          service.is_active
                            ? 'text-yellow-600 hover:text-yellow-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {service.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => deleteService(service.id, service.name)}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {services.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">No hay servicios configurados</div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-blue-600 hover:text-blue-500"
                >
                  Agregar el primer servicio
                </button>
              </div>
            )}
          </div>
        )}

        {/* Categories List */}
        {activeTab === 'categories' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className={!category.is_active ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {category.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {category.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id, category.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {categories.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">No hay categorías configuradas</div>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="text-blue-600 hover:text-blue-500"
                >
                  Agregar la primera categoría
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Agregar Nuevo Servicio</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Consulta General"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción del servicio..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="duration_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (minutos) *
                  </label>
                  <input
                    type="number"
                    id="duration_minutes"
                    required
                    min="15"
                    max="480"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <div className="flex gap-2">
                  <select
                    id="category_id"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin categoría</option>
                    {categories
                      .filter(cat => cat.is_active)
                      .map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowQuickCategoryModal(true)}
                    className="px-3 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
                    title="Crear nueva categoría"
                  >
                    + Nueva
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Servicio activo
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({
                      name: '',
                      description: '',
                      duration_minutes: 60,
                      price: 0,
                      category_id: '',
                      is_active: true
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Guardando...' : 'Guardar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Editar Servicio</h2>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div>
                <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  id="edit_name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="edit_description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="edit_description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit_duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Duración (minutos) *
                  </label>
                  <input
                    type="number"
                    id="edit_duration"
                    required
                    min="15"
                    max="480"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="edit_price" className="block text-sm font-medium text-gray-700 mb-2">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    id="edit_price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit_category" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <div className="flex gap-2">
                  <select
                    id="edit_category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin categoría</option>
                    {categories
                      .filter(cat => cat.is_active)
                      .map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowQuickCategoryModal(true)}
                    className="px-3 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
                    title="Crear nueva categoría"
                  >
                    + Nueva
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit_is_active" className="ml-2 block text-sm text-gray-700">
                  Servicio activo
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingService(null)
                    setFormData({
                      name: '',
                      description: '',
                      duration_minutes: 60,
                      price: 0,
                      category_id: '',
                      is_active: true
                    })
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Guardando...' : 'Actualizar Servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Editar Categoría' : 'Agregar Nueva Categoría'}
              </h2>
            </div>

            <form onSubmit={handleCategorySubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="category_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  id="category_name"
                  required
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Consultas Médicas"
                />
              </div>

              <div>
                <label htmlFor="category_description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  id="category_description"
                  rows={3}
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Descripción de la categoría..."
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false)
                    setEditingCategory(null)
                    setCategoryFormData({ name: '', description: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Guardando...' : (editingCategory ? 'Actualizar' : 'Crear Categoría')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Category Creation Modal */}
      {showQuickCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Crear Categoría Rápida
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Crea una categoría y se seleccionará automáticamente
              </p>
            </div>

            <form onSubmit={handleQuickCategoryCreate} className="p-6">
              <div>
                <label htmlFor="quick_category_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Categoría *
                </label>
                <input
                  type="text"
                  id="quick_category_name"
                  required
                  autoFocus
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Consultas Médicas"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Puedes agregar más detalles después desde el tab Categorías
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickCategoryModal(false)
                    setQuickCategoryName('')
                  }}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !quickCategoryName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Crear y Usar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
