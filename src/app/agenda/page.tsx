'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DoctorSidebar from '@/components/DoctorSidebar'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import WeekCalendarView from '@/components/agenda/WeekCalendarView'
import VisualAvailabilityEditor from '@/components/agenda/VisualAvailabilityEditor'
import CreateAppointmentModal from '@/components/appointments/CreateAppointmentModal'
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal'
import { Icons } from '@/components/ui/Icons'
import { Skeleton, SkeletonCalendar, SkeletonStats } from '@/components/ui/Skeleton'

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
  const [isMobile, setIsMobile] = useState(false)
  const [viewType, setViewType] = useState<'day' | 'week'>('week')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setViewType(mobile ? 'day' : 'week')
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Allow access for admin_tenant, doctor, receptionist, staff, super_admin
    const allowedRoles = ['admin_tenant', 'doctor', 'receptionist', 'staff', 'super_admin']
    if (!loading && (!user || !allowedRoles.includes(user.profile?.role || ''))) {
      router.push('/auth/login')
      return
    }

    if (user && allowedRoles.includes(user.profile?.role || '')) {
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
        console.log('📅 Appointments fetched:', {
          count: appointmentsData?.length || 0,
          dateRange: `${startOfWeek.toISOString().split('T')[0]} to ${endOfWeek.toISOString().split('T')[0]}`,
          appointments: appointmentsData?.map((a: any) => ({
            id: a.id,
            date: a.appointment_date,
            time: a.start_time,
            patient: a.patient_name
          }))
        })
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

  function handleSlotClick(date: Date, hour: number, appointmentId?: string) {
    if (appointmentId) {
      // If there's an existing appointment, show details modal
      setSelectedAppointmentId(appointmentId)
      setShowDetailsModal(true)
    } else {
      // If it's an empty slot, show create modal
      const dateStr = date.toISOString().split('T')[0]
      const timeStr = `${hour.toString().padStart(2, '0')}:00`
      setSelectedSlot({ date: dateStr, time: timeStr })
      setShowCreateModal(true)
    }
  }

  function handleAppointmentCreated() {
    // Refresh appointments data
    fetchDoctorData()
    setSelectedSlot(null)
  }

  function handleDateChange(date: Date) {
    setSelectedDate(date)
  }

  if (loading || loadingData) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar Skeleton */}
        <div className="hidden md:block w-64 bg-white border-r" />
        <div className="flex-1">
          {/* Header Skeleton */}
          <div className="h-16 bg-white border-b" />
          <div className="pt-16 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
              {/* Page Header Skeleton */}
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-9 w-40" />
                  <Skeleton className="h-5 w-56" />
                </div>
                <Skeleton className="h-10 w-32" />
              </div>
              {/* Tabs Skeleton */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex gap-8">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </div>
              {/* Calendar Skeleton */}
              <SkeletonCalendar />
              {/* Stats Skeleton */}
              <SkeletonStats />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isAdminOrStaff = ['admin_tenant', 'receptionist', 'staff', 'super_admin'].includes(user?.profile?.role || '')

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isAdminOrStaff ? (
        <AdminSidebar tenantId={user?.profile?.tenant_id} />
      ) : (
        <DoctorSidebar />
      )}
      <div className="flex-1">
        <AdminHeader />
        <div className="pt-16 p-6">
          <div className="max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Mi Agenda
                </h1>
                <p className="text-gray-600 mt-1">
                  Dr. {user?.profile?.first_name} {user?.profile?.last_name}
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Icons.plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nueva Cita</span>
                <span className="sm:hidden">Nueva</span>
              </button>
            </div>

            {/* Tabs and View Toggle */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex items-center justify-between">
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
                      <span className="hidden sm:inline">Calendario</span>
                      <span className="sm:hidden">Agenda</span>
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

                {/* View Toggle (only show in calendar tab) */}
                {activeTab === 'calendar' && (
                  <div className="flex items-center gap-2 mb-px">
                    <button
                      onClick={() => setViewType('day')}
                      className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                        viewType === 'day'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Día
                    </button>
                    <button
                      onClick={() => setViewType('week')}
                      className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                        viewType === 'week'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Semana
                    </button>
                  </div>
                )}
              </div>
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
                    viewType={viewType}
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

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedSlot(null)
        }}
        onSuccess={handleAppointmentCreated}
        tenantId={user?.profile?.tenant_id || ''}
        doctorId={user?.profile?.role === 'doctor' ? user?.id : undefined}
        selectedDate={selectedSlot?.date}
        selectedTime={selectedSlot?.time}
      />

      {/* Appointment Details Modal */}
      {selectedAppointmentId && (
        <AppointmentDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedAppointmentId(null)
          }}
          appointmentId={selectedAppointmentId}
          userRole={user?.profile?.role || ''}
          onUpdate={handleAppointmentCreated}
        />
      )}
    </div>
  )
}
