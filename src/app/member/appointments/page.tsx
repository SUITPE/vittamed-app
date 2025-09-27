'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import MemberNavigation from '@/components/MemberNavigation'

interface Appointment {
  id: string
  patient_name: string
  patient_email?: string
  patient_phone?: string
  service_name: string
  start_time: string
  end_time: string
  status: string
  notes?: string
}

export default function MemberAppointmentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [error, setError] = useState('')

  // Check if user is member
  const isMember = user?.profile?.role === 'member'
  // For testing purposes, use the known tenant ID
  const currentTenantId = user?.profile?.tenant_id || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

  useEffect(() => {
    if (!loading && (!user || user.profile?.role !== 'member')) {
      router.push('/auth/login')
      return
    }

    if (user && isMember) {
      fetchMyAppointments()
    }
  }, [user, loading, router, isMember])

  async function fetchMyAppointments() {
    try {
      setLoadingData(true)
      setError('')

      // For members, fetch only their assigned appointments
      // Using doctor endpoint for now, would need member-specific endpoint in production
      const appointmentsUrl = `/api/doctors/${user?.id}/appointments?date=${selectedDate}`

      const appointmentsResponse = await fetch(appointmentsUrl)

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        let filteredAppointments = appointmentsData || []

        // Filter by status if selected
        if (selectedStatus) {
          filteredAppointments = filteredAppointments.filter(
            (apt: Appointment) => apt.status === selectedStatus
          )
        }

        setAppointments(filteredAppointments)
      } else {
        console.warn('Could not fetch appointments')
        setAppointments([])
      }

    } catch (error) {
      console.error('Error fetching appointments:', error)
      setError('Error de conexión al cargar citas')
    } finally {
      setLoadingData(false)
    }
  }

  // Refresh when filters change
  useEffect(() => {
    if (user && isMember) {
      fetchMyAppointments()
    }
  }, [selectedDate, selectedStatus])

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      })

      if (response.ok) {
        fetchMyAppointments()
      } else {
        setError('Error al actualizar la cita')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      setError('Error al actualizar la cita')
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    const statusLabels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MemberNavigation currentPath="/member/appointments" tenantId={currentTenantId} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mis citas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isMember) {
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
                Solo los miembros del equipo pueden acceder a sus citas.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MemberNavigation currentPath="/member/appointments" tenantId={currentTenantId} />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              📋 Mis Citas Asignadas
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona las citas que tienes programadas para atender
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="completed">Completadas</option>
                    <option value="cancelled">Canceladas</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {appointments.length} cita{appointments.length !== 1 ? 's' : ''} encontrada{appointments.length !== 1 ? 's' : ''}
                  {selectedDate && ` para ${formatDate(selectedDate)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="bg-white rounded-lg shadow-sm">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  No tienes citas programadas para los filtros seleccionados
                </div>
                <p className="text-sm text-gray-400">
                  Las citas aparecerán aquí cuando sean asignadas por el administrador o recepcionista
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {appointment.patient_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {appointment.service_name}
                        </p>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Horario:</p>
                        <p className="text-sm text-gray-900">
                          {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                        </p>
                      </div>

                      {appointment.patient_email && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Contacto:</p>
                          <p className="text-sm text-gray-900">{appointment.patient_email}</p>
                          {appointment.patient_phone && (
                            <p className="text-sm text-gray-900">{appointment.patient_phone}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700">Notas:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {appointment.notes}
                        </p>
                      </div>
                    )}

                    {/* Action buttons for member */}
                    <div className="flex gap-2">
                      {appointment.status === 'pending' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                        >
                          Confirmar Cita
                        </button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Marcar Completada
                        </button>
                      )}
                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                          className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {appointments.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Resumen de Citas
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {appointments.length}
                    </div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {appointments.filter(a => a.status === 'confirmed').length}
                    </div>
                    <div className="text-sm text-gray-500">Confirmadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {appointments.filter(a => a.status === 'pending').length}
                    </div>
                    <div className="text-sm text-gray-500">Pendientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {appointments.filter(a => a.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-500">Completadas</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}