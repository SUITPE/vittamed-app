'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DoctorSidebar from '@/components/DoctorSidebar'
import AdminHeader from '@/components/AdminHeader'
import WeekCalendarView from '@/components/agenda/WeekCalendarView'
import VisualAvailabilityEditor from '@/components/agenda/VisualAvailabilityEditor'
import { Icons } from '@/components/ui/Icons'

interface DoctorAvailability {
  id?: string
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
  appointment_date: string
  start_time: string
  end_time: string
  status: string
}

export default function AgendaPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [availability, setAvailability] = useState<DoctorAvailability[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<'calendar' | 'settings'>('calendar')

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
      if (!user?.id) {
        setLoadingData(false)
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const fetchOptions = {
        signal: controller.signal,
        credentials: 'include' as RequestCredentials,
        headers: {
          'Content-Type': 'application/json'
        }
      }

      // Fetch availability
      const availabilityResponse = await fetch(
        `/api/doctors/${user.id}/availability`,
        fetchOptions
      )

      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json()
        setAvailability(availabilityData || [])
      } else {
        if (availabilityResponse.status === 401) {
          router.push('/auth/login')
          return
        }
        setAvailability([])
      }

      // Fetch appointments for current week
      const startOfWeek = getWeekStart(selectedDate)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)

      const appointmentsResponse = await fetch(
        `/api/doctors/${user.id}/appointments?start=${startOfWeek.toISOString().split('T')[0]}&end=${endOfWeek.toISOString().split('T')[0]}`,
        fetchOptions
      )

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        setAppointments(appointmentsData || [])
      } else {
        if (appointmentsResponse.status === 401) {
          router.push('/auth/login')
          return
        }
        setAppointments([])
      }

      clearTimeout(timeoutId)
    } catch (error) {
      console.error('Error fetching doctor data:', error)
      setAvailability([])
      setAppointments([])
    } finally {
      setLoadingData(false)
    }
  }

  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  async function handleAvailabilityUpdate(blocks: Array<{ day: number; startTime: string; endTime: string }>) {
    try {
      console.log('🚀 Sending POST request to save availability:', {
        url: `/api/doctors/${user?.id}/availability`,
        blockCount: blocks.length,
        blocks
      })

      const response = await fetch(`/api/doctors/${user?.id}/availability`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blocks })
      })

      console.log('📡 Response received:', {
        status: response.status,
        ok: response.ok
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Save successful, response data:', data)
        await fetchDoctorData()
      } else {
        const errorText = await response.text()
        console.error('❌ Error response:', { status: response.status, error: errorText })

        if (response.status === 401) {
          router.push('/auth/login')
        } else {
          alert(`Error al guardar: ${errorText}`)
        }
      }
    } catch (error) {
      console.error('❌ Exception during save:', error)
      alert('Error de conexión al guardar la disponibilidad')
      throw error
    }
  }

  function handleSlotClick(date: Date, hour: number) {
    console.log('Slot clicked:', date, hour)
    // TODO: Implement slot click handler (e.g., create appointment, block time, etc.)
  }

  function handleDateChange(date: Date) {
    setSelectedDate(date)
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
          <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Mi Agenda
              </h1>
              <p className="text-gray-600 mt-1">
                Dr. {user?.profile?.first_name} {user?.profile?.last_name}
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'calendar'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icons.calendarDays className="w-5 h-5" />
                    <span className="hidden sm:inline">Vista Semanal</span>
                    <span className="sm:hidden">Calendario</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icons.settings className="w-5 h-5" />
                    <span className="hidden sm:inline">Configurar Disponibilidad</span>
                    <span className="sm:hidden">Configurar</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {activeTab === 'calendar' && (
                <div>
                  <WeekCalendarView
                    startDate={selectedDate}
                    availability={availability}
                    appointments={appointments}
                    onSlotClick={handleSlotClick}
                    onDateChange={handleDateChange}
                  />

                  {/* Quick Stats */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Icons.calendarDays className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {appointments.length}
                          </div>
                          <div className="text-sm text-gray-500">Citas esta semana</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Icons.checkCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {appointments.filter(a => a.status === 'confirmed').length}
                          </div>
                          <div className="text-sm text-gray-500">Confirmadas</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <Icons.clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {appointments.filter(a => a.status === 'pending').length}
                          </div>
                          <div className="text-sm text-gray-500">Pendientes</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Icons.clock3 className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-gray-900">
                            {availability.length}
                          </div>
                          <div className="text-sm text-gray-500">Días disponibles</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <VisualAvailabilityEditor
                  availability={availability}
                  onUpdate={handleAvailabilityUpdate}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
