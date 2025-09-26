'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import MemberNavigation from '@/components/MemberNavigation'

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  address?: string
  emergency_contact?: string
  medical_notes?: string
  created_at: string
  updated_at: string
}

interface PatientAppointment {
  id: string
  service_name: string
  start_time: string
  status: string
}

export default function MemberPatientsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientAppointments, setPatientAppointments] = useState<PatientAppointment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
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
      fetchMyPatients()
    }
  }, [user, loading, router, isMember])

  async function fetchMyPatients() {
    try {
      setLoadingData(true)
      setError('')

      // Fetch patients assigned to this member through appointments
      const response = await fetch(`/api/doctors/${user?.id}/patients`)

      if (response.ok) {
        const patientsData = await response.json()
        setPatients(patientsData || [])
      } else {
        console.warn('Could not fetch assigned patients')
        setPatients([])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
      setError('Error al cargar pacientes asignados')
    } finally {
      setLoadingData(false)
    }
  }

  async function fetchPatientAppointments(patientId: string) {
    try {
      setLoadingAppointments(true)

      // Fetch appointments between this member and the selected patient
      const response = await fetch(`/api/doctors/${user?.id}/appointments?patient_id=${patientId}`)

      if (response.ok) {
        const appointmentsData = await response.json()
        setPatientAppointments(appointmentsData || [])
      } else {
        console.warn('Could not fetch patient appointments')
        setPatientAppointments([])
      }
    } catch (error) {
      console.error('Error fetching patient appointments:', error)
      setPatientAppointments([])
    } finally {
      setLoadingAppointments(false)
    }
  }

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    fetchPatientAppointments(patient.id)
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
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

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.phone && patient.phone.includes(searchTerm))
  )

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MemberNavigation currentPath="/member/patients" tenantId={currentTenantId} />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mis pacientes...</p>
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
                Solo los miembros del equipo pueden acceder a sus pacientes asignados.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MemberNavigation currentPath="/member/patients" tenantId={currentTenantId} />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              🧑‍⚕️ Mis Pacientes Asignados
            </h1>
            <p className="text-gray-600 mt-1">
              Pacientes que tienes asignados a través de citas programadas
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Patients List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Lista de Pacientes
                    </h2>
                    <div className="text-sm text-gray-500">
                      {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar paciente..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredPatients.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      {searchTerm ? 'No se encontraron pacientes' : 'No tienes pacientes asignados aún'}
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedPatient?.id === patient.id ? 'bg-indigo-50 border-r-2 border-indigo-600' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {patient.first_name} {patient.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">{patient.email}</p>
                            {patient.phone && (
                              <p className="text-sm text-gray-500">{patient.phone}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {patient.date_of_birth && (
                              <p className="text-sm text-gray-500">
                                {calculateAge(patient.date_of_birth)} años
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Patient Details */}
            <div className="lg:col-span-2">
              {selectedPatient ? (
                <div className="space-y-6">
                  {/* Patient Info */}
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Información del Paciente
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">
                            {selectedPatient.first_name} {selectedPatient.last_name}
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Email:</label>
                              <p className="text-sm text-gray-900">{selectedPatient.email}</p>
                            </div>
                            {selectedPatient.phone && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Teléfono:</label>
                                <p className="text-sm text-gray-900">{selectedPatient.phone}</p>
                              </div>
                            )}
                            {selectedPatient.date_of_birth && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">Edad:</label>
                                <p className="text-sm text-gray-900">
                                  {calculateAge(selectedPatient.date_of_birth)} años ({new Date(selectedPatient.date_of_birth).toLocaleDateString('es-ES')})
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          {selectedPatient.address && (
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700">Dirección:</label>
                              <p className="text-sm text-gray-900">{selectedPatient.address}</p>
                            </div>
                          )}
                          {selectedPatient.emergency_contact && (
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700">Contacto de Emergencia:</label>
                              <p className="text-sm text-gray-900">{selectedPatient.emergency_contact}</p>
                            </div>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Paciente desde:</label>
                            <p className="text-sm text-gray-900">
                              {new Date(selectedPatient.created_at).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedPatient.medical_notes && (
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Notas Médicas:</label>
                          <div className="bg-gray-50 rounded-md p-3">
                            <p className="text-sm text-gray-900">{selectedPatient.medical_notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appointment History */}
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-6 border-b">
                      <h2 className="text-xl font-semibold text-gray-900">
                        Historial de Citas Conmigo
                      </h2>
                    </div>
                    <div className="p-6">
                      {loadingAppointments ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Cargando citas...</p>
                        </div>
                      ) : patientAppointments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No hay citas registradas con este paciente
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {patientAppointments.map((appointment) => (
                            <div key={appointment.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">
                                  {appointment.service_name}
                                </div>
                                {getStatusBadge(appointment.status)}
                              </div>
                              <div className="text-sm text-gray-500">
                                <p>
                                  {new Date(appointment.start_time).toLocaleDateString('es-ES', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })} a las {new Date(appointment.start_time).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-12 text-center">
                    <div className="text-gray-400 text-6xl mb-4">👥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Selecciona un Paciente
                    </h3>
                    <p className="text-gray-500">
                      Haz clic en un paciente de la lista para ver su información detallada y historial de citas contigo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}