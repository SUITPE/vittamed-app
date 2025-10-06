'use client'

import { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'

interface AppointmentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentId: string
  userRole: string
  onUpdate?: () => void
}

interface AppointmentDetails {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: string
  patient_name: string
  patient_email?: string
  service_name: string
  doctor_name?: string
  notes?: string
}

export default function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointmentId,
  userRole,
  onUpdate
}: AppointmentDetailsModalProps) {
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen && appointmentId) {
      fetchAppointmentDetails()
    }
  }, [isOpen, appointmentId])

  async function fetchAppointmentDetails() {
    try {
      setLoading(true)
      console.log('🔍 Fetching appointment details for ID:', appointmentId)

      if (!appointmentId) {
        console.error('❌ No appointmentId provided')
        return
      }

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        credentials: 'include'
      })

      console.log('📡 Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Appointment data:', data)
        setAppointment(data.appointment)
        setNotes(data.appointment.notes || '')
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to fetch appointment details:', response.status, errorText)
      }
    } catch (error) {
      console.error('❌ Error fetching appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateAppointmentStatus(newStatus: string) {
    try {
      setUpdating(true)
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await fetchAppointmentDetails()
        onUpdate?.()
      } else {
        alert('Error al actualizar el estado de la cita')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error de conexión')
    } finally {
      setUpdating(false)
    }
  }

  async function saveNotes() {
    try {
      setUpdating(true)
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      })

      if (response.ok) {
        await fetchAppointmentDetails()
        onUpdate?.()
        alert('Notas guardadas exitosamente')
      } else {
        alert('Error al guardar las notas')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Error de conexión')
    } finally {
      setUpdating(false)
    }
  }

  function handleAttendPatient() {
    // Navigate to patient consultation page
    window.location.href = `/appointments/${appointmentId}/attend`
  }

  if (!isOpen) return null

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      confirmed: { label: 'Confirmada', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      completed: { label: 'Completada', className: 'bg-green-100 text-green-700 border-green-200' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700 border-red-200' },
      in_progress: { label: 'En Atención', className: 'bg-purple-100 text-purple-700 border-purple-200' }
    }
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' }
    return (
      <span className={`text-sm font-medium px-3 py-1 rounded-full border ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Detalles de la Cita</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icons.x className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : appointment ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div>{getStatusBadge(appointment.status)}</div>
                <div className="text-sm text-gray-500">
                  ID: {appointment.id.slice(0, 8)}...
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Icons.user className="w-5 h-5 text-blue-600" />
                  Información del Paciente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Nombre:</span>
                    <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                  </div>
                  {appointment.patient_email && (
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium text-gray-900">{appointment.patient_email}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Icons.calendar className="w-5 h-5 text-blue-600" />
                  Detalles de la Cita
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Fecha:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Hora:</span>
                    <p className="font-medium text-gray-900">
                      {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Servicio:</span>
                    <p className="font-medium text-gray-900">{appointment.service_name}</p>
                  </div>
                  {appointment.doctor_name && (
                    <div>
                      <span className="text-gray-600">Doctor:</span>
                      <p className="font-medium text-gray-900">{appointment.doctor_name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section (for doctors) */}
              {(userRole === 'doctor' || userRole === 'admin_tenant') && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Notas de la Consulta
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Agregar notas sobre la consulta..."
                  />
                  <button
                    onClick={saveNotes}
                    disabled={updating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {updating ? 'Guardando...' : 'Guardar Notas'}
                  </button>
                </div>
              )}

              {/* Action Buttons Based on Role */}
              <div className="border-t pt-4 space-y-3">
                {/* Doctor Actions */}
                {userRole === 'doctor' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={handleAttendPatient}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        <Icons.stethoscope className="w-5 h-5" />
                        Atender Paciente
                      </button>
                    )}
                    {appointment.status === 'in_progress' && (
                      <button
                        onClick={() => updateAppointmentStatus('completed')}
                        disabled={updating}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <Icons.checkCircle className="w-5 h-5" />
                        Completar Cita
                      </button>
                    )}
                    {appointment.status === 'pending' && (
                      <button
                        onClick={() => updateAppointmentStatus('confirmed')}
                        disabled={updating}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <Icons.checkCircle className="w-5 h-5" />
                        Confirmar Cita
                      </button>
                    )}
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <button
                        onClick={() => updateAppointmentStatus('cancelled')}
                        disabled={updating}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <Icons.x className="w-5 h-5" />
                        Cancelar Cita
                      </button>
                    )}
                  </div>
                )}

                {/* Receptionist Actions */}
                {userRole === 'receptionist' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {appointment.status === 'pending' && (
                      <button
                        onClick={() => updateAppointmentStatus('confirmed')}
                        disabled={updating}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <Icons.checkCircle className="w-5 h-5" />
                        Confirmar Cita
                      </button>
                    )}
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <button
                        onClick={() => updateAppointmentStatus('cancelled')}
                        disabled={updating}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <Icons.x className="w-5 h-5" />
                        Cancelar Cita
                      </button>
                    )}
                  </div>
                )}

                {/* Admin/Staff Actions */}
                {(userRole === 'admin_tenant' || userRole === 'staff') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {appointment.status === 'pending' && (
                      <button
                        onClick={() => updateAppointmentStatus('confirmed')}
                        disabled={updating}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <Icons.checkCircle className="w-5 h-5" />
                        Confirmar Cita
                      </button>
                    )}
                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                      <button
                        onClick={() => updateAppointmentStatus('cancelled')}
                        disabled={updating}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                      >
                        <Icons.x className="w-5 h-5" />
                        Cancelar Cita
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No se pudo cargar la información de la cita</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
