'use client'

import { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'

interface Patient {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
}

interface Service {
  id: string
  name: string
  duration: number
  price: number
}

interface Doctor {
  id: string
  first_name: string
  last_name: string
  specialty?: string
}

interface CreateAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  tenantId: string
  doctorId?: string // If provided, doctor field will be pre-filled and disabled
  selectedDate?: string
  selectedTime?: string
}

export default function CreateAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  tenantId,
  doctorId,
  selectedDate,
  selectedTime
}: CreateAppointmentModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    patient_id: '',
    service_id: '',
    doctor_id: doctorId || '',
    appointment_date: selectedDate || new Date().toISOString().split('T')[0],
    start_time: selectedTime || '09:00',
    notes: '',
    allow_overbooking: false
  })
  const [showConflictWarning, setShowConflictWarning] = useState(false)

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && tenantId) {
      loadModalData()
    }
  }, [isOpen, tenantId])

  // Update form when props change
  useEffect(() => {
    if (doctorId) {
      setFormData(prev => ({ ...prev, doctor_id: doctorId }))
    }
    if (selectedDate) {
      setFormData(prev => ({ ...prev, appointment_date: selectedDate }))
    }
    if (selectedTime) {
      setFormData(prev => ({ ...prev, start_time: selectedTime }))
    }
  }, [doctorId, selectedDate, selectedTime])

  async function loadModalData() {
    try {
      setLoading(true)
      setError('')

      // Load patients, services, and doctors in parallel
      const [patientsRes, servicesRes, doctorsRes] = await Promise.all([
        fetch(`/api/patients?tenantId=${tenantId}`),
        fetch(`/api/tenants/${tenantId}/services`),
        !doctorId ? fetch(`/api/tenants/${tenantId}/doctors`) : Promise.resolve(null)
      ])

      if (patientsRes.ok) {
        const data = await patientsRes.json()
        // data is already an array of patients
        setPatients(Array.isArray(data) ? data : [])
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json()
        setServices(data.services || [])
      }

      if (doctorsRes && doctorsRes.ok) {
        const data = await doctorsRes.json()
        setDoctors(data.doctors || [])
      }
    } catch (err) {
      console.error('Error loading modal data:', err)
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.patient_id || !formData.service_id || !formData.doctor_id) {
      setError('Por favor completa todos los campos obligatorios')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/tenants/${tenantId}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
        onClose()
        resetForm()
      } else {
        const errorData = await response.json()
        // Show conflict warning if there's a scheduling conflict
        if (errorData.code === 'CONFLICT') {
          setShowConflictWarning(true)
        }
        setError(errorData.error || 'Error al crear la cita')
      }
    } catch (err) {
      console.error('Error creating appointment:', err)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      patient_id: '',
      service_id: '',
      doctor_id: doctorId || '',
      appointment_date: selectedDate || new Date().toISOString().split('T')[0],
      start_time: selectedTime || '09:00',
      notes: '',
      allow_overbooking: false
    })
    setError('')
    setShowConflictWarning(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              Nueva Cita
            </h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Icons.x className="w-5 h-5" />
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Patient Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paciente <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.patient_id}
                onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              >
                <option value="">Seleccionar paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.first_name} {patient.last_name}
                    {patient.email && ` - ${patient.email}`}
                    {!patient.email && patient.phone && ` - ${patient.phone}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Doctor Selection (if not pre-filled) */}
            {!doctorId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.doctor_id}
                  onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                >
                  <option value="">Seleccionar doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                      {doctor.specialty && ` - ${doctor.specialty}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servicio <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.service_id}
                onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              >
                <option value="">Seleccionar servicio</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.duration} min - ${service.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.appointment_date}
                  onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Overbooking Option */}
            {showConflictWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icons.alertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      Conflicto de horario detectado
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Ya existe una cita programada en este horario. Puedes activar overbooking para agendar de todas formas.
                    </p>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.allow_overbooking}
                        onChange={(e) => {
                          setFormData({ ...formData, allow_overbooking: e.target.checked })
                          if (e.target.checked) {
                            setError('')
                          }
                        }}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium text-amber-800">
                        Permitir overbooking
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Agregar notas adicionales..."
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Icons.plus className="w-4 h-4" />
                    Crear Cita
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
