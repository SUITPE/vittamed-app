'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/ui/Icons'

interface Appointment {
  id: string
  patient_id: string
  patient_name: string
  patient_email?: string
  patient_phone?: string
  service_name: string
  doctor_name: string
  start_time: string
  end_time: string
  status: string
  doctor_id: string
}

interface Doctor {
  id: string
  first_name: string
  last_name: string
  specialty?: string
}

interface AppointmentsClientProps {
  initialAppointments: Appointment[]
  doctors: Doctor[]
  tenantId: string
  isDoctor: boolean
  userId?: string
  initialDate?: string
}

export default function AppointmentsClient({
  initialAppointments,
  doctors,
  tenantId,
  isDoctor,
  userId,
  initialDate
}: AppointmentsClientProps) {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [loadingData, setLoadingData] = useState(false)
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0])
  const [selectedDoctor, setSelectedDoctor] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [error, setError] = useState('')

  async function fetchAppointmentsData() {
    try {
      setLoadingData(true)
      setError('')

      // Build appointments URL with filters
      let appointmentsUrl = `/api/tenants/${tenantId}/appointments?date=${selectedDate}`

      if (selectedDoctor) {
        appointmentsUrl += `&doctor_id=${selectedDoctor}`
      }

      // If user is doctor, only show their appointments
      if (isDoctor && userId) {
        appointmentsUrl += `&doctor_id=${userId}`
      }

      const appointmentsResponse = await fetch(appointmentsUrl)

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        let filteredAppointments = appointmentsData.appointments || []

        // Filter by status if selected
        if (selectedStatus) {
          filteredAppointments = filteredAppointments.filter(
            (apt: Appointment) => apt.status === selectedStatus
          )
        }

        setAppointments(filteredAppointments)
      } else {
        setError('Error al cargar las citas')
      }

    } catch (error) {
      console.error('Error fetching appointments:', error)
      setError('Error de conexión')
    } finally {
      setLoadingData(false)
    }
  }

  // Refresh when filters change
  useEffect(() => {
    fetchAppointmentsData()
  }, [selectedDate, selectedDoctor, selectedStatus])

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
        router.refresh()
        fetchAppointmentsData()
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

  const formatTime = (timeString: string, dateString?: string) => {
    // If it's just a time string (HH:MM:SS), display it directly
    if (timeString && timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
      return timeString.substring(0, 5) // Return HH:MM
    }

    // If it's a full datetime, parse and format it
    if (dateString) {
      const fullDateTime = `${dateString}T${timeString}`
      return new Date(fullDateTime).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return new Date(timeString).toLocaleTimeString('es-ES', {
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

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando citas...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Citas
        </h1>
        <p className="text-gray-600 mt-1">
          {isDoctor ? 'Gestiona tus citas médicas' : 'Administra todas las citas médicas'}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {!isDoctor && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor
                </label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <p className="text-sm text-gray-500">
              {appointments.length} cita{appointments.length !== 1 ? 's' : ''} encontrada{appointments.length !== 1 ? 's' : ''}
              <span className="hidden md:inline">{selectedDate && ` para ${formatDate(selectedDate)}`}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm">
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No se encontraron citas para los filtros seleccionados
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horario
                  </th>
                  {!isDoctor && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Servicio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {appointment.patient_name}
                      </div>
                      {appointment.patient_email && (
                        <div className="text-sm text-gray-500">
                          {appointment.patient_email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                      </div>
                    </td>
                    {!isDoctor && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {appointment.doctor_name}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {appointment.service_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {isDoctor && appointment.patient_id && (
                          <button
                            onClick={() => router.push(`/patients/${appointment.patient_id}`)}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Ver perfil y atender paciente"
                          >
                            <Icons.activity className="w-5 h-5" />
                          </button>
                        )}
                        {appointment.status === 'pending' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                            title="Confirmar cita"
                          >
                            <Icons.checkCircle className="w-5 h-5" />
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Completar cita"
                          >
                            <Icons.checkCircle className="w-5 h-5" />
                          </button>
                        )}
                        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancelar cita"
                          >
                            <Icons.x className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {appointment.patient_name}
                    </div>
                    {appointment.patient_email && (
                      <div className="text-sm text-gray-500">
                        {appointment.patient_email}
                      </div>
                    )}
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Icons.clock className="w-4 h-4 mr-2" />
                    {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                  </div>
                  {!isDoctor && (
                    <div className="flex items-center text-gray-600">
                      <Icons.user className="w-4 h-4 mr-2" />
                      {appointment.doctor_name}
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Icons.stethoscope className="w-4 h-4 mr-2" />
                    {appointment.service_name}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {isDoctor && appointment.patient_id && (
                    <button
                      onClick={() => router.push(`/appointments/${appointment.id}/attend`)}
                      className="flex-1 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center justify-center gap-1"
                    >
                      <Icons.activity className="w-4 h-4" />
                      Atender
                    </button>
                  )}
                  {appointment.status === 'pending' && (
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                      className="flex-1 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                    >
                      Confirmar
                    </button>
                  )}
                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                      className="flex-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                    >
                      Completar
                    </button>
                  )}
                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                      className="flex-1 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </>
  )
}
