'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import MemberNavigation from '@/components/MemberNavigation'

interface MemberAvailability {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  lunch_start?: string
  lunch_end?: string
}

interface Appointment {
  id: string
  patient_name: string
  service_name: string
  start_time: string
  end_time: string
  status: string
}

export default function MemberAgendaPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [availability, setAvailability] = useState<MemberAvailability[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loadingData, setLoadingData] = useState(true)
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
      fetchMemberData()
    }
  }, [user, loading, router])

  async function fetchMemberData() {
    try {
      setLoadingData(true)
      setError('')

      // For members, we'll use similar endpoints as doctors
      // In a real implementation, you might need member-specific endpoints
      const [availabilityResponse, appointmentsResponse] = await Promise.all([
        fetch(`/api/doctors/${user?.id}/availability`),
        fetch(`/api/doctors/${user?.id}/appointments?date=${selectedDate}`)
      ])

      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json()
        setAvailability(availabilityData || [])
      } else {
        console.warn('Could not fetch availability - might not be set up yet')
        setAvailability([])
      }

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        setAppointments(appointmentsData || [])
      } else {
        console.warn('Could not fetch appointments')
        setAppointments([])
      }
    } catch (error) {
      console.error('Error fetching member data:', error)
      setError('Error al cargar la agenda')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (selectedDate && user && isMember) {
      fetchMemberData()
    }
  }, [selectedDate])

  async function handleAvailabilityUpdate(dayOfWeek: number, data: Partial<MemberAvailability>) {
    try {
      const response = await fetch(`/api/doctors/${user?.id}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day_of_week: dayOfWeek,
          ...data
        })
      })

      if (response.ok) {
        fetchMemberData()
      } else {
        setError('Error al actualizar horario')
      }
    } catch (error) {
      console.error('Error updating availability:', error)
      setError('Error al actualizar horario')
    }
  }

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
        fetchMemberData()
      } else {
        setError('Error al actualizar cita')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      setError('Error al actualizar cita')
    }
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[dayOfWeek]
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

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MemberNavigation currentPath="/member/agenda" tenantId={currentTenantId} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mi agenda...</p>
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
                Solo los miembros del equipo pueden acceder a esta agenda.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MemberNavigation currentPath="/member/agenda" tenantId={currentTenantId} />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              📅 Mi Agenda - {user?.profile?.first_name} {user?.profile?.last_name}
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona tu disponibilidad y revisa tus citas asignadas
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Schedule Management */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Mi Horario de Disponibilidad</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Define tus horarios de trabajo para cada día
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6, 0].map(dayOfWeek => {
                    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek)

                    return (
                      <div key={dayOfWeek} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-900">{getDayName(dayOfWeek)}</h3>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={!!dayAvailability}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleAvailabilityUpdate(dayOfWeek, {
                                    start_time: '09:00',
                                    end_time: '17:00',
                                    lunch_start: '13:00',
                                    lunch_end: '14:00'
                                  })
                                } else {
                                  // In a real app, you'd have a delete endpoint
                                  console.log('Would delete availability for', dayOfWeek)
                                }
                              }}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-2 text-sm text-gray-600">Disponible</span>
                          </label>
                        </div>

                        {dayAvailability && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Inicio
                              </label>
                              <input
                                type="time"
                                value={dayAvailability.start_time || '09:00'}
                                onChange={(e) => handleAvailabilityUpdate(dayOfWeek, {
                                  ...dayAvailability,
                                  start_time: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Fin
                              </label>
                              <input
                                type="time"
                                value={dayAvailability.end_time || '17:00'}
                                onChange={(e) => handleAvailabilityUpdate(dayOfWeek, {
                                  ...dayAvailability,
                                  end_time: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Almuerzo (inicio)
                              </label>
                              <input
                                type="time"
                                value={dayAvailability.lunch_start || '13:00'}
                                onChange={(e) => handleAvailabilityUpdate(dayOfWeek, {
                                  ...dayAvailability,
                                  lunch_start: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Almuerzo (fin)
                              </label>
                              <input
                                type="time"
                                value={dayAvailability.lunch_end || '14:00'}
                                onChange={(e) => handleAvailabilityUpdate(dayOfWeek, {
                                  ...dayAvailability,
                                  lunch_end: e.target.value
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* My Appointments */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Mis Citas del Día</h2>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="p-6">
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No tienes citas programadas para este día
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">
                            {appointment.patient_name}
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>
                            <span className="font-medium">Servicio:</span> {appointment.service_name}
                          </p>
                          <p>
                            <span className="font-medium">Horario:</span>{' '}
                            {new Date(appointment.start_time).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} - {new Date(appointment.end_time).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="mt-3 flex gap-2">
                          {appointment.status === 'pending' && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                              className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                            >
                              Confirmar
                            </button>
                          )}
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                              className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                            >
                              Completar
                            </button>
                          )}
                          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                            <button
                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                              className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
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
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-8 bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Resumen de Hoy
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {appointments.length}
                  </div>
                  <div className="text-sm text-gray-500">Total Citas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {appointments.filter(a => a.status === 'confirmed').length}
                  </div>
                  <div className="text-sm text-gray-500">Confirmadas</div>
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
        </div>
      </div>
    </div>
  )
}