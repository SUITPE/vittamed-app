'use client'

import { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
}

interface Client {
  id: string
  first_name: string
  last_name: string
  phone?: string
}

interface AppointmentSummaryPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  selectedDoctor: { id: string; first_name: string; last_name: string } | null
  services: Service[]
  client: Client | 'walk-in' | null
  onAddService: () => void
  onSelectClient: () => void
  onSave: () => void
  onCheckout: () => void
  totalDuration?: number
  onDurationChange?: (minutes: number) => void
}

export default function AppointmentSummaryPanel({
  isOpen,
  onClose,
  selectedDate,
  selectedDoctor,
  services,
  client,
  onAddService,
  onSelectClient,
  onSave,
  onCheckout,
  totalDuration,
  onDurationChange
}: AppointmentSummaryPanelProps) {
  const [isEditingDuration, setIsEditingDuration] = useState(false)
  const [editedDuration, setEditedDuration] = useState(0)

  // Calculate total duration from services
  const calculateTotalDuration = () => {
    return services.reduce((sum, service) => sum + service.duration_minutes, 0)
  }

  // Update edited duration when services change
  useEffect(() => {
    const calculated = totalDuration || calculateTotalDuration()
    setEditedDuration(calculated)
  }, [services, totalDuration])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const calculateTotal = () => {
    return services.reduce((sum, service) => sum + service.price, 0)
  }

  const getClientDisplay = () => {
    if (!client) return null
    if (client === 'walk-in') return 'Walk-In'
    return `${client.first_name} ${client.last_name}`
  }

  const handleDurationSave = () => {
    if (onDurationChange) {
      onDurationChange(editedDuration)
    }
    setIsEditingDuration(false)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[450px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Icons.x className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Client Section */}
          <div>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                {client && client !== 'walk-in' ? (
                  <span className="text-xl font-semibold text-blue-600">
                    {client.first_name[0]}{client.last_name[0]}
                  </span>
                ) : (
                  <Icons.userPlus className="w-8 h-8 text-blue-600" />
                )}
              </div>
            </div>

            <button
              onClick={onSelectClient}
              className="w-full mb-4"
            >
              <div className="text-center">
                <div className="font-semibold text-gray-900 text-lg mb-1">
                  {client ? getClientDisplay() : 'Add client'}
                </div>
                {!client && (
                  <div className="text-sm text-gray-500">Or leave empty for walk-ins</div>
                )}
                {client && client !== 'walk-in' && client.phone && (
                  <div className="text-sm text-gray-500">{client.phone}</div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Date & Time */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {formatDate(selectedDate)}
              </div>
              <div className="text-sm text-gray-500">
                {formatTime(selectedDate)} · Doesn't repeat
              </div>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-md">
              <Icons.chevronDown className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Services Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Services</h3>

            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{service.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatTime(selectedDate)} · {service.duration_minutes}min
                      {selectedDoctor && ` · ${selectedDoctor.first_name}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">PEN {service.price}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onAddService}
              className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <Icons.plus className="w-5 h-5" />
              <span className="font-medium">Add service</span>
            </button>

            {/* Total Duration Section */}
            {services.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Total Duration</h3>

                {!isEditingDuration ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Icons.clock className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900">{editedDuration} minutes</span>
                      <span className="text-sm text-gray-500">({Math.floor(editedDuration / 60)}h {editedDuration % 60}m)</span>
                    </div>
                    <button
                      onClick={() => setIsEditingDuration(true)}
                      className="p-2 hover:bg-blue-100 rounded-md transition-colors"
                      title="Edit duration"
                    >
                      <Icons.edit className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editedDuration}
                      onChange={(e) => setEditedDuration(parseInt(e.target.value) || 0)}
                      min="0"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Minutes"
                    />
                    <button
                      onClick={handleDurationSave}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditedDuration(calculateTotalDuration())
                        setIsEditingDuration(false)
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Adjust the total duration if services can be completed faster than scheduled
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold text-gray-900">Total</div>
            <div className="text-2xl font-bold text-gray-900">PEN {calculateTotal()}</div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCheckout}
              disabled={services.length === 0}
              className="flex-1 py-3 px-4 bg-white border border-gray-300 rounded-lg font-medium text-gray-900 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
            <button
              onClick={onSave}
              disabled={services.length === 0}
              className="flex-1 py-3 px-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
