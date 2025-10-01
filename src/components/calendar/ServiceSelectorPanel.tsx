'use client'

import { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'

interface Service {
  id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  category?: string
}

interface ServiceSelectorPanelProps {
  isOpen: boolean
  onClose: () => void
  onSelectService: (service: Service) => void
  tenantId: string
}

export default function ServiceSelectorPanel({
  isOpen,
  onClose,
  onSelectService,
  tenantId
}: ServiceSelectorPanelProps) {
  const [services, setServices] = useState<Service[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchServices()
    }
  }, [isOpen, tenantId])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tenants/${tenantId}/services`)
      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group services by category
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    const category = service.category || 'General'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-[400px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Select a service</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icons.x className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by service name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Services List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                <div key={category}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      {category}
                    </h3>
                    <span className="text-sm text-gray-500">{categoryServices.length}</span>
                  </div>

                  <div className="space-y-2">
                    {categoryServices.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => onSelectService(service)}
                        className="w-full text-left p-4 hover:bg-gray-50 rounded-lg transition-colors border-l-4 border-transparent hover:border-blue-500"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 mb-1">
                              {service.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {service.duration_minutes}min
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              PEN {service.price}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {filteredServices.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <Icons.search className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-600">No services found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
