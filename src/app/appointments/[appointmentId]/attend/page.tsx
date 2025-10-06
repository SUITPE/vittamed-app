'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Icons } from '@/components/ui/Icons'
import DoctorSidebar from '@/components/DoctorSidebar'
import AdminHeader from '@/components/AdminHeader'

interface AppointmentDetails {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: string
  patient_name: string
  patient_email?: string
  patient_phone?: string
  service_name: string
  doctor_name?: string
  notes?: string
}

export default function AttendAppointmentPage({
  params
}: {
  params: Promise<{ appointmentId: string }>
}) {
  const { appointmentId } = use(params)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Consultation notes
  const [consultationNotes, setConsultationNotes] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [treatment, setTreatment] = useState('')

  // Vital signs
  const [vitalSigns, setVitalSigns] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    oxygenSaturation: ''
  })

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.profile?.role !== 'doctor') {
        router.push('/auth/login')
        return
      }
      fetchAppointmentDetails()
    }
  }, [user, authLoading, appointmentId])

  async function fetchAppointmentDetails() {
    try {
      setLoading(true)
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAppointment(data.appointment)
        setConsultationNotes(data.appointment.notes || '')

        // Update status to in_progress if it's confirmed
        if (data.appointment.status === 'confirmed') {
          await updateAppointmentStatus('in_progress')
        }
      } else {
        console.error('Failed to fetch appointment')
        router.push('/agenda')
      }
    } catch (error) {
      console.error('Error:', error)
      router.push('/agenda')
    } finally {
      setLoading(false)
    }
  }

  async function updateAppointmentStatus(newStatus: string) {
    try {
      await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  async function handleSaveNotes() {
    try {
      setSaving(true)
      const fullNotes = `
NOTAS DE CONSULTA:
${consultationNotes}

DIAGNÓSTICO:
${diagnosis}

TRATAMIENTO:
${treatment}

SIGNOS VITALES:
- Presión Arterial: ${vitalSigns.bloodPressure || 'N/A'}
- Frecuencia Cardíaca: ${vitalSigns.heartRate || 'N/A'}
- Temperatura: ${vitalSigns.temperature || 'N/A'}
- Peso: ${vitalSigns.weight || 'N/A'}
- Altura: ${vitalSigns.height || 'N/A'}
- Saturación de Oxígeno: ${vitalSigns.oxygenSaturation || 'N/A'}
      `.trim()

      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes: fullNotes })
      })

      if (response.ok) {
        alert('Notas guardadas exitosamente')
      } else {
        alert('Error al guardar las notas')
      }
    } catch (error) {
      console.error('Error saving notes:', error)
      alert('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleCompleteAppointment() {
    if (!consultationNotes && !diagnosis) {
      alert('Por favor, agregue notas de consulta o diagnóstico antes de completar la cita')
      return
    }

    try {
      setSaving(true)

      // Save notes first
      await handleSaveNotes()

      // Then update status
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'completed' })
      })

      if (response.ok) {
        alert('Cita completada exitosamente')
        router.push('/agenda')
      } else {
        alert('Error al completar la cita')
      }
    } catch (error) {
      console.error('Error completing appointment:', error)
      alert('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DoctorSidebar />
      <div className="flex-1">
        <AdminHeader />
        <div className="pt-16 p-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <button
                onClick={() => router.push('/agenda')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <Icons.arrowLeft className="w-5 h-5" />
                Volver a la agenda
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Atención Médica</h1>
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  appointment.status === 'in_progress'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {appointment.status === 'in_progress' ? 'En Atención' : appointment.status}
                </span>
                <span className="text-gray-500">
                  {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })} - {appointment.start_time.slice(0, 5)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Patient Info */}
              <div className="lg:col-span-1 space-y-6">
                {/* Patient Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Icons.user className="w-5 h-5 text-blue-600" />
                    Información del Paciente
                  </h2>
                  <div className="space-y-3 text-sm">
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
                    {appointment.patient_phone && (
                      <div>
                        <span className="text-gray-600">Teléfono:</span>
                        <p className="font-medium text-gray-900">{appointment.patient_phone}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Servicio:</span>
                      <p className="font-medium text-gray-900">{appointment.service_name}</p>
                    </div>
                  </div>
                </div>

                {/* Vital Signs */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Icons.activity className="w-5 h-5 text-blue-600" />
                    Signos Vitales
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Presión Arterial</label>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={vitalSigns.bloodPressure}
                        onChange={(e) => setVitalSigns({...vitalSigns, bloodPressure: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Frecuencia Cardíaca</label>
                      <input
                        type="text"
                        placeholder="72 bpm"
                        value={vitalSigns.heartRate}
                        onChange={(e) => setVitalSigns({...vitalSigns, heartRate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Temperatura (°C)</label>
                      <input
                        type="text"
                        placeholder="36.5"
                        value={vitalSigns.temperature}
                        onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Peso (kg)</label>
                      <input
                        type="text"
                        placeholder="70"
                        value={vitalSigns.weight}
                        onChange={(e) => setVitalSigns({...vitalSigns, weight: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Altura (cm)</label>
                      <input
                        type="text"
                        placeholder="170"
                        value={vitalSigns.height}
                        onChange={(e) => setVitalSigns({...vitalSigns, height: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Saturación O2 (%)</label>
                      <input
                        type="text"
                        placeholder="98"
                        value={vitalSigns.oxygenSaturation}
                        onChange={(e) => setVitalSigns({...vitalSigns, oxygenSaturation: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Consultation Notes */}
              <div className="lg:col-span-2 space-y-6">
                {/* Consultation Notes */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Icons.fileText className="w-5 h-5 text-blue-600" />
                    Notas de Consulta
                  </h2>
                  <textarea
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    rows={6}
                    placeholder="Motivo de consulta, síntomas, observaciones..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Diagnosis */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Icons.clipboardList className="w-5 h-5 text-blue-600" />
                    Diagnóstico
                  </h2>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={4}
                    placeholder="Diagnóstico médico..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Treatment */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Icons.pill className="w-5 h-5 text-blue-600" />
                    Tratamiento y Recomendaciones
                  </h2>
                  <textarea
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    rows={4}
                    placeholder="Medicamentos, dosis, recomendaciones..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-4 bg-white rounded-lg shadow-sm p-6">
                  <button
                    onClick={handleSaveNotes}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    {saving ? 'Guardando...' : 'Guardar Notas'}
                  </button>
                  <button
                    onClick={handleCompleteAppointment}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Icons.checkCircle className="w-5 h-5" />
                    {saving ? 'Procesando...' : 'Completar Cita'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
