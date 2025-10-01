'use client'

import { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'

interface Service {
  id: string
  name: string
  duration_minutes: number
  price: number
}

interface AppointmentService {
  service: Service
  duration_override?: number
}

interface Appointment {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  patient_name: string
  service_name: string
  status: string
  doctor_id: string
  doctor_name?: string
  total_amount?: number
}

interface AppointmentEditModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onUpdate: (appointmentId: string, updates: any) => Promise<void>
  onAddService: (appointmentId: string) => void
  tenantId: string
}

export default function AppointmentEditModal({
  isOpen,
  onClose,
  appointment,
  onUpdate,
  onAddService,
  tenantId
}: AppointmentEditModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [services, setServices] = useState<AppointmentService[]>([])
  const [totalDuration, setTotalDuration] = useState(0)
  const [isEditingDuration, setIsEditingDuration] = useState(false)
  const [editedDuration, setEditedDuration] = useState(0)

  useEffect(() => {
    if (appointment) {
      // Parse appointment times to get duration
      const start = new Date(`2000-01-01T${appointment.start_time}`)
      const end = new Date(`2000-01-01T${appointment.end_time}`)
      const duration = (end.getTime() - start.getTime()) / (1000 * 60)
      setTotalDuration(duration)
      setEditedDuration(duration)

      // Initialize with the current service
      // In a real implementation, you'd fetch all services for this appointment
      setServices([])
    }
  }, [appointment])

  if (!isOpen || !appointment) return null

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5) // HH:MM
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }
    return labels[status as keyof typeof labels] || status
  }

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    try {
      await onUpdate(appointment.id, { status: newStatus })
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error al actualizar el estado')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDurationSave = async () => {
    setIsLoading(true)
    try {
      // Calculate new end time based on edited duration
      const start = new Date(`${appointment.appointment_date}T${appointment.start_time}`)
      const newEnd = new Date(start.getTime() + editedDuration * 60 * 1000)
      const endTime = newEnd.toTimeString().slice(0, 5) // HH:MM

      await onUpdate(appointment.id, { end_time: endTime })
      setTotalDuration(editedDuration)
      setIsEditingDuration(false)
    } catch (error) {
      console.error('Error updating duration:', error)
      alert('Error al actualizar la duración')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Detalles de la Cita</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Icons.x className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Status Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(appointment.status)}`}>
              <Icons.checkCircle className="w-4 h-4" />
              <span className="font-semibold">{getStatusLabel(appointment.status)}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Patient Info */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Paciente</h3>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Icons.user className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{appointment.patient_name}</div>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Fecha y Hora</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Icons.calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Fecha</span>
                  </div>
                  <div className="font-semibold text-gray-900">{formatDate(appointment.appointment_date)}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Icons.clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Hora</span>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">Servicios</h3>
                <button
                  onClick={() => onAddService(appointment.id)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Icons.plus className="w-4 h-4" />
                  Agregar servicio
                </button>
              </div>

              <div className="space-y-2">
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                  <div className="font-medium text-gray-900">{appointment.service_name}</div>
                  {appointment.doctor_name && (
                    <div className="text-sm text-gray-600 mt-1">
                      <Icons.user className="w-3 h-3 inline mr-1" />
                      {appointment.doctor_name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Duration */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Duración Total</h3>

              {!isEditingDuration ? (
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icons.clock className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">{totalDuration} minutos</span>
                    <span className="text-sm text-gray-500">
                      ({Math.floor(totalDuration / 60)}h {totalDuration % 60}m)
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditingDuration(true)}
                    className="p-2 hover:bg-blue-100 rounded-md transition-colors"
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
                    placeholder="Minutos"
                  />
                  <button
                    onClick={handleDurationSave}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditedDuration(totalDuration)
                      setIsEditingDuration(false)
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Price */}
            {appointment.total_amount && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Total</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">PEN {appointment.total_amount}</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              {appointment.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange('confirmed')}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Confirmar Cita
                </button>
              )}

              {appointment.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusChange('completed')}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  Marcar Completada
                </button>
              )}

              {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Cancelar Cita
                </button>
              )}

              <button
                onClick={onClose}
                className="py-3 px-6 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
