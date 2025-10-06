'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import { Icons } from '@/components/ui/Icons'
import { RECORD_TYPE_CONFIG, SEVERITY_CONFIG } from '@/types/medical-history'
import type { MedicalRecordWithRelations } from '@/types/medical-history'
import MedicalRecordForm from '@/components/medical/MedicalRecordForm'

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  document: string
  date_of_birth: string | null
  address: string | null
  medical_history: string | null
  created_at: string
}

export default function PatientProfilePage({ params }: { params: Promise<{ patientId: string }> }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'allergies'>('history')
  const [patientId, setPatientId] = useState<string>('')
  const [showRecordForm, setShowRecordForm] = useState(false)
  const [recordToEdit, setRecordToEdit] = useState<MedicalRecordWithRelations | null>(null)

  const currentTenantId = user?.profile?.tenant_id

  useEffect(() => {
    params.then(p => setPatientId(p.patientId))
  }, [params])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && patientId) {
      fetchPatientData()
    }
  }, [user, patientId])

  const fetchPatientData = async () => {
    try {
      setLoading(true)

      // Fetch patient info
      const patientResponse = await fetch(`/api/patients/${patientId}`)
      if (patientResponse.ok) {
        const patientData = await patientResponse.json()
        setPatient(patientData)
      }

      // Fetch medical records
      const recordsResponse = await fetch(`/api/patients/${patientId}/medical-records`)
      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json()
        setMedicalRecords(recordsData.medical_records || [])
      }
    } catch (error) {
      console.error('Error fetching patient data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birth = new Date(dateOfBirth)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar tenantId={currentTenantId ?? undefined} />
        <AdminHeader />
        <div className="ml-64 pt-16 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando información del paciente...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar tenantId={currentTenantId ?? undefined} />
        <AdminHeader />
        <div className="ml-64 pt-16 p-6">
          <div className="text-center py-12">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Paciente no encontrado</h2>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-800"
            >
              Volver atrás
            </button>
          </div>
        </div>
      </div>
    )
  }

  const age = calculateAge(patient.date_of_birth)

  // Check if current user is doctor or admin
  const canCreateRecords = user?.profile?.role && ['doctor', 'admin_tenant', 'super_admin'].includes(user.profile.role)

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar tenantId={currentTenantId ?? undefined} />
      <AdminHeader />

      <div className="ml-64 pt-16">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Patient Header */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Icons.user className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {patient.first_name} {patient.last_name}
                      </h1>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {age && (
                          <div className="flex items-center gap-1">
                            <Icons.calendar className="w-4 h-4" />
                            {age} años
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Icons.mail className="w-4 h-4" />
                          {patient.email}
                        </div>
                        {patient.phone && (
                          <div className="flex items-center gap-1">
                            <Icons.phone className="w-4 h-4" />
                            {patient.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Icons.user className="w-4 h-4" />
                          Doc: {patient.document}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-2"
                  >
                    <Icons.arrowLeft className="w-4 h-4" />
                    Volver
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-t border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`${
                      activeTab === 'history'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icons.activity className="w-4 h-4" />
                    Historia Clínica ({medicalRecords.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`${
                      activeTab === 'info'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icons.user className="w-4 h-4" />
                    Información Personal
                  </button>
                  <button
                    onClick={() => setActiveTab('allergies')}
                    className={`${
                      activeTab === 'allergies'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icons.alertCircle className="w-4 h-4" />
                    Alergias
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                {/* Add Record Button */}
                {canCreateRecords && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowRecordForm(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Icons.plus className="w-4 h-4" />
                      Nuevo Registro Médico
                    </button>
                  </div>
                )}

                {medicalRecords.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icons.activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sin historia clínica
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Este paciente aún no tiene registros médicos. La historia se crea automáticamente al completar citas.
                    </p>
                    {canCreateRecords && (
                      <button
                        onClick={() => setShowRecordForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Icons.plus className="w-4 h-4" />
                        Crear Primer Registro
                      </button>
                    )}
                  </div>
                ) : (
                  medicalRecords.map((record) => {
                    const config = RECORD_TYPE_CONFIG[record.record_type]
                    return (
                      <div key={record.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {/* Record Header */}
                        <div className="p-6 border-b border-gray-200 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{config.icon}</span>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {config.label}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {new Date(record.record_date).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                  {record.doctor_name && ` • Dr. ${record.doctor_name}`}
                                </p>
                              </div>
                            </div>
                            {canCreateRecords && (
                              <button
                                onClick={() => {
                                  setRecordToEdit(record)
                                  setShowRecordForm(true)
                                }}
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                              >
                                <Icons.edit className="w-4 h-4" />
                                Editar
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Record Content */}
                        <div className="p-6 space-y-4">
                          {/* Chief Complaint */}
                          {record.chief_complaint && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Motivo de Consulta</h4>
                              <p className="text-gray-700">{record.chief_complaint}</p>
                            </div>
                          )}

                          {/* SOAP Notes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {record.subjective && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <span className="text-blue-600">S</span> Subjetivo
                                </h4>
                                <p className="text-gray-700 text-sm">{record.subjective}</p>
                              </div>
                            )}
                            {record.objective && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <span className="text-green-600">O</span> Objetivo
                                </h4>
                                <p className="text-gray-700 text-sm">{record.objective}</p>
                              </div>
                            )}
                            {record.assessment && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <span className="text-purple-600">A</span> Evaluación
                                </h4>
                                <p className="text-gray-700 text-sm">{record.assessment}</p>
                              </div>
                            )}
                            {record.plan && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                  <span className="text-orange-600">P</span> Plan
                                </h4>
                                <p className="text-gray-700 text-sm">{record.plan}</p>
                              </div>
                            )}
                          </div>

                          {/* Vital Signs */}
                          {record.vital_signs && Object.keys(record.vital_signs).length > 0 && (
                            <div className="border-t border-gray-200 pt-4">
                              <h4 className="font-semibold text-gray-900 mb-3">Signos Vitales</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {record.vital_signs.temperature && (
                                  <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-600">Temperatura</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                      {record.vital_signs.temperature}°C
                                    </div>
                                  </div>
                                )}
                                {(record.vital_signs.blood_pressure_systolic || record.vital_signs.blood_pressure_diastolic) && (
                                  <div className="bg-red-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-600">Presión Arterial</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                      {record.vital_signs.blood_pressure_systolic}/{record.vital_signs.blood_pressure_diastolic}
                                    </div>
                                  </div>
                                )}
                                {record.vital_signs.heart_rate && (
                                  <div className="bg-pink-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-600">Frecuencia Cardíaca</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                      {record.vital_signs.heart_rate} bpm
                                    </div>
                                  </div>
                                )}
                                {record.vital_signs.weight && (
                                  <div className="bg-green-50 p-3 rounded-lg">
                                    <div className="text-xs text-gray-600">Peso</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                      {record.vital_signs.weight} kg
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Prescriptions */}
                          {record.prescriptions && record.prescriptions.length > 0 && (
                            <div className="border-t border-gray-200 pt-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                💊 Recetas ({record.prescriptions.length})
                              </h4>
                              <div className="space-y-2">
                                {record.prescriptions.map((prescription) => (
                                  <div key={prescription.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                    <div className="font-semibold text-gray-900">{prescription.medication_name}</div>
                                    <div className="text-sm text-gray-700 mt-1">
                                      {prescription.dosage} • {prescription.frequency}
                                      {prescription.duration && ` • ${prescription.duration}`}
                                    </div>
                                    {prescription.instructions && (
                                      <div className="text-sm text-gray-600 mt-2 italic">
                                        {prescription.instructions}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Diagnoses */}
                          {record.diagnoses && record.diagnoses.length > 0 && (
                            <div className="border-t border-gray-200 pt-4">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                🔬 Diagnósticos ({record.diagnoses.length})
                              </h4>
                              <div className="space-y-2">
                                {record.diagnoses.map((diagnosis) => (
                                  <div key={diagnosis.id} className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="font-semibold text-gray-900">{diagnosis.diagnosis_name}</div>
                                        {diagnosis.diagnosis_code && (
                                          <div className="text-sm text-gray-600 mt-1">
                                            Código: {diagnosis.diagnosis_code}
                                          </div>
                                        )}
                                        {diagnosis.notes && (
                                          <div className="text-sm text-gray-700 mt-2">{diagnosis.notes}</div>
                                        )}
                                      </div>
                                      {diagnosis.severity && (
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${SEVERITY_CONFIG[diagnosis.severity].color}-100 text-${SEVERITY_CONFIG[diagnosis.severity].color}-800`}>
                                          {SEVERITY_CONFIG[diagnosis.severity].label}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {activeTab === 'info' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                    <div className="text-gray-900">{patient.first_name} {patient.last_name}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Documento</label>
                    <div className="text-gray-900">{patient.document}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="text-gray-900">{patient.email}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <div className="text-gray-900">{patient.phone || 'No registrado'}</div>
                  </div>
                  {patient.date_of_birth && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                      <div className="text-gray-900">
                        {new Date(patient.date_of_birth).toLocaleDateString('es-ES')} ({age} años)
                      </div>
                    </div>
                  )}
                  {patient.address && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                      <div className="text-gray-900">{patient.address}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'allergies' && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icons.alertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Alergias</h3>
                <p className="text-gray-500">
                  Función de alergias próximamente disponible
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Medical Record Form Modal */}
      {showRecordForm && (
        <MedicalRecordForm
          isOpen={showRecordForm}
          onClose={() => {
            setShowRecordForm(false)
            setRecordToEdit(null)
          }}
          patientId={patientId}
          tenantId={currentTenantId || ''}
          doctorId={user?.profile?.id || ''}
          doctorName={user?.profile ? `${user.profile.first_name} ${user.profile.last_name}` : ''}
          recordToEdit={recordToEdit}
          onSuccess={() => {
            fetchPatientData()
            setShowRecordForm(false)
            setRecordToEdit(null)
          }}
        />
      )}
    </div>
  )
}
