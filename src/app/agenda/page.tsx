'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DoctorSidebar from '@/components/DoctorSidebar'
import AdminHeader from '@/components/AdminHeader'

interface DoctorAvailability {
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

export default function AgendaPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [availability, setAvailability] = useState<DoctorAvailability[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.profile?.role !== 'doctor')) {
      router.push('/auth/login')
      return
    }

    if (user && user.profile?.role === 'doctor') {
      fetchDoctorData()
    }
  }, [user, loading, router])

  async function fetchDoctorData() {
    try {
      // Debug user context
      console.log('🔍 fetchDoctorData called with user:', {
        userId: user?.id,
        userEmail: user?.email,
        userRole: user?.profile?.role,
        selectedDate,
        loading
      })

      if (!user?.id) {
        console.error('❌ No user ID available, skipping API calls')
        setLoadingData(false)
        return
      }

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      // Fetch options with credentials for authentication
      const fetchOptions = {
        signal: controller.signal,
        credentials: 'include' as RequestCredentials,
        headers: {
          'Content-Type': 'application/json'
        }
      }

      const availabilityUrl = `/api/doctors/${user.id}/availability`
      const appointmentsUrl = `/api/doctors/${user.id}/appointments?date=${selectedDate}`

      console.log('🌐 Making API calls to:', {
        availabilityUrl,
        appointmentsUrl
      })

      const [availabilityResponse, appointmentsResponse] = await Promise.all([
        fetch(availabilityUrl, fetchOptions),
        fetch(appointmentsUrl, fetchOptions)
      ])

      clearTimeout(timeoutId)

      // Handle availability response
      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json()
        setAvailability(availabilityData || [])
      } else {
        const errorText = await availabilityResponse.text()
        console.error('Availability API failed:', {
          status: availabilityResponse.status,
          statusText: availabilityResponse.statusText,
          error: errorText
        })

        // Handle authentication errors
        if (availabilityResponse.status === 401) {
          console.error('Authentication required for availability API')
          router.push('/auth/login')
          return
        }

        setAvailability([])
      }

      // Handle appointments response
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        setAppointments(appointmentsData || [])
      } else {
        const errorText = await appointmentsResponse.text()
        console.error('Appointments API failed:', {
          status: appointmentsResponse.status,
          statusText: appointmentsResponse.statusText,
          error: errorText
        })

        // Handle authentication errors
        if (appointmentsResponse.status === 401) {
          console.error('Authentication required for appointments API')
          router.push('/auth/login')
          return
        }

        setAppointments([])
      }
    } catch (error) {
      console.error('Error fetching doctor data:', error)

      // Handle abort/timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Request timed out after 10 seconds')
      }

      // Set empty data to continue with UI rendering
      setAvailability([])
      setAppointments([])
    } finally {
      setLoadingData(false)
    }
  }

  async function handleAvailabilityUpdate(dayOfWeek: number, data: Partial<DoctorAvailability>) {
    try {
      const response = await fetch(`/api/doctors/${user?.id}/availability`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          day_of_week: dayOfWeek,
          ...data
        })
      })

      if (response.ok) {
        fetchDoctorData()
      } else {
        const errorText = await response.text()
        console.error('Failed to update availability:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })

        if (response.status === 401) {
          router.push('/auth/login')
        }
      }
    } catch (error) {
      console.error('Error updating availability:', error)
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

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando agenda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DoctorSidebar />
      <div className="flex-1">
        <AdminHeader />
        <div className="pt-16 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Mi Agenda - Dr. {user?.profile?.first_name} {user?.profile?.last_name}
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona tu disponibilidad y revisa tus citas
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Horarios de Disponibilidad</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configura tus horarios de trabajo para cada día de la semana
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

                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Citas del Día</h2>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    fetchDoctorData()
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="p-6">
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay citas programadas para este día
                </p>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">
                          {appointment.patient_name}
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.service_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(appointment.start_time).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {new Date(appointment.end_time).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => {

                          }}
                          className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => {

                          }}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                        >
                          Completar
                        </button>
                        <button
                          onClick={() => {

                          }}
                          className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
  )
}