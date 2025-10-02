'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import CalendarView from '@/components/calendar/CalendarView'
import WeeklyCalendarView from '@/components/calendar/WeeklyCalendarView'
import AppointmentQuickMenu from '@/components/calendar/AppointmentQuickMenu'
import ServiceSelectorPanel from '@/components/calendar/ServiceSelectorPanel'
import ClientSelectorPanel from '@/components/calendar/ClientSelectorPanel'
import AppointmentSummaryPanel from '@/components/calendar/AppointmentSummaryPanel'
import AppointmentEditModal from '@/components/calendar/AppointmentEditModal'
import { Icons } from '@/components/ui/Icons'

interface Doctor {
  id: string
  first_name: string
  last_name: string
  specialty?: string
}

interface DoctorAvailability {
  id: string
  doctor_id: string
  day_of_week: number
  start_time: string
  end_time: string
  lunch_start?: string
  lunch_end?: string
  doctor: Doctor
}

interface Appointment {
  id: string
  appointment_date: string
  patient_name: string
  service_name: string
  start_time: string
  end_time: string
  status: string
  doctor_name?: string
  doctor_id: string
  total_amount?: number
}

// Helper function to get local date in YYYY-MM-DD format
function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper function to get local time in HH:MM format
function getLocalTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export default function ReceptionistAgendaPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [availability, setAvailability] = useState<DoctorAvailability[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState(getLocalDateString())
  const [selectedDoctor, setSelectedDoctor] = useState<string>('')
  const [loadingData, setLoadingData] = useState(true)
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'list'>('week')

  // Appointment creation flow
  const [quickMenuPosition, setQuickMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const [showServiceSelector, setShowServiceSelector] = useState(false)
  const [showClientSelector, setShowClientSelector] = useState(false)
  const [showSummaryPanel, setShowSummaryPanel] = useState(false)
  const [appointmentDraft, setAppointmentDraft] = useState<{
    doctor_id: string | null
    datetime: Date | null
    services: any[]
    client: any | null
  }>({
    doctor_id: null,
    datetime: null,
    services: [],
    client: null
  })

  // Appointment edit modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Check if user is receptionist, staff, or admin_tenant
  const isReceptionist = user?.profile?.role === 'receptionist' || user?.profile?.role === 'staff' || user?.profile?.role === 'admin_tenant'
  const currentTenantId = user?.profile?.tenant_id || undefined

  useEffect(() => {
    if (!loading && (!user || (user.profile?.role !== 'receptionist' && user.profile?.role !== 'staff' && user.profile?.role !== 'admin_tenant'))) {
      router.push('/auth/login')
      return
    }

    if (user && isReceptionist && currentTenantId) {
      fetchDoctorsAndAgenda()
    }
  }, [user, loading, router, isReceptionist, currentTenantId])

  // Reload appointments when date or doctor changes
  useEffect(() => {
    if (currentTenantId && selectedDate) {
      console.log('[Calendar] Date changed to:', selectedDate)
      // Fetch only appointments, not doctors again
      const fetchAppointmentsForDate = async () => {
        const appointmentsUrl = selectedDoctor
          ? `/api/tenants/${currentTenantId}/appointments?date=${selectedDate}&doctor_id=${selectedDoctor}`
          : `/api/tenants/${currentTenantId}/appointments?date=${selectedDate}`

        const appointmentsResponse = await fetch(appointmentsUrl)

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json()
          console.log('[Calendar] Appointments fetched:', {
            count: appointmentsData.appointments?.length || 0,
            date: selectedDate,
            appointments: appointmentsData.appointments
          })
          setAppointments(appointmentsData.appointments || [])
        } else {
          console.error('[Calendar] Failed to fetch appointments:', appointmentsResponse.status)
        }
      }

      fetchAppointmentsForDate()
    }
  }, [selectedDate, selectedDoctor, currentTenantId])

  async function fetchDoctorsAndAgenda() {
    if (!currentTenantId) {
      console.warn('No tenant ID available')
      return
    }

    try {
      setLoadingData(true)

      // Fetch all doctors in tenant
      const doctorsResponse = await fetch(`/api/tenants/${currentTenantId}/doctors`)

      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json()
        setDoctors(doctorsData.doctors || [])

        if (doctorsData.doctors && doctorsData.doctors.length > 0 && !selectedDoctor) {
          setSelectedDoctor(doctorsData.doctors[0].id)
        }
      }

      // Fetch appointments for all doctors or selected doctor
      const appointmentsUrl = selectedDoctor
        ? `/api/tenants/${currentTenantId}/appointments?date=${selectedDate}&doctor_id=${selectedDoctor}`
        : `/api/tenants/${currentTenantId}/appointments?date=${selectedDate}`

      const appointmentsResponse = await fetch(appointmentsUrl)

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        setAppointments(appointmentsData.appointments || [])
      }

      // Fetch availability for all doctors
      const availabilityResponse = await fetch(`/api/tenants/${currentTenantId}/availability`)

      if (availabilityResponse.ok) {
        const availabilityData = await availabilityResponse.json()
        setAvailability(availabilityData.availability || [])
      }

    } catch (error) {
      console.error('Error fetching agenda data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (selectedDate || selectedDoctor) {
      fetchDoctorsAndAgenda()
    }
  }, [selectedDate, selectedDoctor])

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
        // Refresh appointments
        fetchDoctorsAndAgenda()
      } else {
        console.error('Error updating appointment status')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  // Appointment creation flow handlers
  const handleTimeSlotClick = (event: React.MouseEvent, doctorId: string, time: Date) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    setQuickMenuPosition({ x: rect.left, y: rect.top + rect.height / 2 })
    setAppointmentDraft({
      doctor_id: doctorId,
      datetime: time,
      services: [],
      client: null
    })
  }

  const handleAddAppointment = () => {
    setShowServiceSelector(true)
  }

  const handleServiceSelected = (service: any) => {
    setAppointmentDraft(prev => ({
      ...prev,
      services: [...prev.services, service]
    }))
    setShowServiceSelector(false)
    setShowSummaryPanel(true)

    // If no client selected yet, show client selector
    if (!appointmentDraft.client) {
      setTimeout(() => setShowClientSelector(true), 300)
    }
  }

  const handleClientSelected = (client: any) => {
    setAppointmentDraft(prev => ({
      ...prev,
      client
    }))
  }

  const handleSaveAppointment = async () => {
    if (!appointmentDraft.doctor_id || !appointmentDraft.datetime || appointmentDraft.services.length === 0) {
      alert('Please complete all required fields')
      return
    }

    try {
      const service = appointmentDraft.services[0]
      const endTime = new Date(appointmentDraft.datetime)
      endTime.setMinutes(endTime.getMinutes() + service.duration_minutes)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: currentTenantId,
          doctor_id: appointmentDraft.doctor_id,
          service_id: service.id,
          patient_first_name: !appointmentDraft.client || appointmentDraft.client === 'walk-in' ? 'Walk' : appointmentDraft.client.first_name,
          patient_last_name: !appointmentDraft.client || appointmentDraft.client === 'walk-in' ? 'In' : appointmentDraft.client.last_name,
          patient_email: appointmentDraft.client && appointmentDraft.client !== 'walk-in' && appointmentDraft.client.email ? appointmentDraft.client.email : 'walkin@clinic.local',
          patient_phone: appointmentDraft.client && appointmentDraft.client !== 'walk-in' && appointmentDraft.client.phone ? appointmentDraft.client.phone : null,
          appointment_date: getLocalDateString(appointmentDraft.datetime),
          start_time: getLocalTimeString(appointmentDraft.datetime)
        })
      })

      if (response.ok) {
        // Reset draft and close panels
        setAppointmentDraft({
          doctor_id: null,
          datetime: null,
          services: [],
          client: null
        })
        setShowSummaryPanel(false)
        // Refresh appointments
        fetchDoctorsAndAgenda()
      } else {
        alert('Error creating appointment')
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Error creating appointment')
    }
  }

  const handleUpdateAppointment = async (appointmentId: string, updates: any) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        // Refresh appointments
        fetchDoctorsAndAgenda()
        // Close modal if status was updated
        if (updates.status) {
          setShowEditModal(false)
          setSelectedAppointment(null)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Error al actualizar la cita')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      throw error
    }
  }

  const handleAddServiceToAppointment = (appointmentId: string) => {
    // TODO: Implement adding services to existing appointment
    // This would open the service selector and allow adding more services
    console.log('Add service to appointment:', appointmentId)
    alert('Funcionalidad de agregar servicios en desarrollo')
  }

  const handleAppointmentMove = async (appointmentId: string, newDoctorId: string, newStartTime: Date) => {
    try {
      // Find the appointment to get its duration
      const appointment = appointments.find(apt => apt.id === appointmentId)
      if (!appointment) {
        console.error('Appointment not found')
        return
      }

      // Calculate duration and new end time
      const startDate = new Date(`${appointment.appointment_date}T${appointment.start_time}`)
      const endDate = new Date(`${appointment.appointment_date}T${appointment.end_time}`)
      const durationMs = endDate.getTime() - startDate.getTime()

      const newEndTime = new Date(newStartTime.getTime() + durationMs)

      // Update the appointment
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctor_id: newDoctorId,
          appointment_date: getLocalDateString(newStartTime),
          start_time: getLocalTimeString(newStartTime),
          end_time: getLocalTimeString(newEndTime)
        })
      })

      if (response.ok) {
        // Refresh appointments
        fetchDoctorsAndAgenda()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al mover la cita')
      }
    } catch (error) {
      console.error('Error moving appointment:', error)
      alert('Error al mover la cita')
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar tenantId={currentTenantId} />
        <AdminHeader />
        <div className="ml-64 pt-16 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando agendas...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isReceptionist) {
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
                Solo el personal administrativo puede acceder a las agendas.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar tenantId={currentTenantId} />
      <AdminHeader />
      <div className="ml-64 pt-16">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header - UPDATED NAVIGATION */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    📅 Agendas de Doctores
                  </h1>
                <p className="text-gray-600 mt-1">
                  Visualiza horarios y gestiona citas de todos los doctores
                </p>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('week')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                    ${viewMode === 'week'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'}
                  `}
                >
                  <Icons.calendarDays className="w-4 h-4" />
                  Semana
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                    ${viewMode === 'month'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'}
                  `}
                >
                  <Icons.calendar className="w-4 h-4" />
                  Mes
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                    ${viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'}
                  `}
                >
                  <Icons.list className="w-4 h-4" />
                  Lista
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Doctor
                  </label>
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Todos los doctores</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.first_name} {doctor.last_name}
                        {doctor.specialty && ` - ${doctor.specialty}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Calendar View (Fresha-style) */}
          {viewMode === 'week' && (
            <div className="h-[calc(100vh-300px)]">
              <WeeklyCalendarView
                key={selectedDate} // Force re-render when date changes
                doctors={doctors}
                appointments={appointments}
                selectedDate={(() => {
                  // Parse YYYY-MM-DD as local date (not UTC)
                  const [year, month, day] = selectedDate.split('-').map(Number)
                  return new Date(year, month - 1, day)
                })()}
                onDateChange={(date) => {
                  const newDateString = getLocalDateString(date)
                  console.log('[Page] Date changing from', selectedDate, 'to', newDateString)
                  setSelectedDate(newDateString)
                }}
                onTimeSlotClick={handleTimeSlotClick}
                onAppointmentClick={(appointment) => {
                  setSelectedAppointment(appointment)
                  setShowEditModal(true)
                }}
                onAppointmentMove={handleAppointmentMove}
              />
            </div>
          )}

          {/* Monthly Calendar View */}
          {viewMode === 'month' && (
            <CalendarView
              appointments={appointments}
              selectedDate={new Date(selectedDate)}
              onDateChange={(date) => {
                setSelectedDate(getLocalDateString(date))
              }}
              onAppointmentClick={(appointment) => {
                setSelectedAppointment(appointment)
                setShowEditModal(true)
              }}
            />
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Doctor Availability */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Horarios de Disponibilidad
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Horarios configurados por los doctores
                </p>
              </div>
              <div className="p-6">
                {selectedDoctor ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5, 6, 0].map(dayOfWeek => {
                      const dayAvailability = availability.find(a =>
                        a.day_of_week === dayOfWeek && a.doctor_id === selectedDoctor
                      )

                      return (
                        <div key={dayOfWeek} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-gray-900">{getDayName(dayOfWeek)}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              dayAvailability
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {dayAvailability ? 'Disponible' : 'No disponible'}
                            </span>
                          </div>

                          {dayAvailability && (
                            <div className="text-sm text-gray-600">
                              <p>
                                <span className="font-medium">Horario:</span>{' '}
                                {dayAvailability.start_time} - {dayAvailability.end_time}
                              </p>
                              {dayAvailability.lunch_start && dayAvailability.lunch_end && (
                                <p>
                                  <span className="font-medium">Almuerzo:</span>{' '}
                                  {dayAvailability.lunch_start} - {dayAvailability.lunch_end}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Selecciona un doctor para ver sus horarios
                  </div>
                )}
              </div>
            </div>

            {/* Appointments */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Citas del Día
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedDate === getLocalDateString()
                    ? 'Citas de hoy'
                    : `Citas del ${new Date(selectedDate).toLocaleDateString('es-ES')}`
                  }
                </p>
              </div>
              <div className="p-6">
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay citas programadas para este día
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

                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Doctor:</span> {appointment.doctor_name}
                          </p>
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

                        {/* Action buttons for receptionist */}
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
                              Marcar Completada
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
                          <button
                            onClick={() => router.push(`/appointments/${appointment.id}/edit`)}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Quick Stats */}
          <div className="mt-8 bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Resumen del Día
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
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
        </div>
        </div>
      </div>

      {/* Appointment creation flow modals */}
      {quickMenuPosition && (
        <AppointmentQuickMenu
          position={quickMenuPosition}
          onClose={() => setQuickMenuPosition(null)}
          onAddAppointment={handleAddAppointment}
          onAddGroupAppointment={() => console.log('Add group appointment')}
          onAddBlockedTime={() => console.log('Add blocked time')}
        />
      )}

      <ServiceSelectorPanel
        isOpen={showServiceSelector}
        onClose={() => setShowServiceSelector(false)}
        onSelectService={handleServiceSelected}
        tenantId={currentTenantId || ''}
      />

      <ClientSelectorPanel
        isOpen={showClientSelector}
        onClose={() => setShowClientSelector(false)}
        onSelectClient={handleClientSelected}
        tenantId={currentTenantId || ''}
      />

      {appointmentDraft.datetime && (
        <AppointmentSummaryPanel
          isOpen={showSummaryPanel}
          onClose={() => {
            setShowSummaryPanel(false)
            setAppointmentDraft({
              doctor_id: null,
              datetime: null,
              services: [],
              client: null
            })
          }}
          selectedDate={appointmentDraft.datetime}
          selectedDoctor={doctors.find(d => d.id === appointmentDraft.doctor_id) || null}
          services={appointmentDraft.services}
          client={appointmentDraft.client}
          onAddService={() => setShowServiceSelector(true)}
          onSelectClient={() => setShowClientSelector(true)}
          onSave={handleSaveAppointment}
          onCheckout={() => console.log('Checkout')}
        />
      )}

      {/* Appointment Edit Modal */}
      <AppointmentEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedAppointment(null)
        }}
        appointment={selectedAppointment}
        onUpdate={handleUpdateAppointment}
        onAddService={handleAddServiceToAppointment}
        tenantId={currentTenantId || ''}
      />
    </div>
  )
}