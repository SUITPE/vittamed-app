'use client'

import { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'
import type { RecordType, MedicalRecordFormData, PrescriptionFormData, DiagnosisFormData } from '@/types/medical-history'

interface MedicalRecordFormProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  tenantId: string
  doctorId: string
  doctorName: string
  recordToEdit?: any // For future edit functionality
  onSuccess: () => void
}

export default function MedicalRecordForm({
  isOpen,
  onClose,
  patientId,
  tenantId,
  doctorId,
  doctorName,
  recordToEdit,
  onSuccess
}: MedicalRecordFormProps) {
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'basic' | 'vitals' | 'prescriptions' | 'diagnoses'>('basic')

  // Form state
  const [formData, setFormData] = useState<MedicalRecordFormData>({
    record_type: 'consultation',
    record_date: new Date().toISOString().split('T')[0],
    chief_complaint: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    vital_signs: {},
    attachments: []
  })

  const [prescriptions, setPrescriptions] = useState<PrescriptionFormData[]>([])
  const [diagnoses, setDiagnoses] = useState<DiagnosisFormData[]>([])

  // Load record data if editing
  useEffect(() => {
    if (recordToEdit) {
      setFormData({
        record_type: recordToEdit.record_type,
        record_date: recordToEdit.record_date,
        chief_complaint: recordToEdit.chief_complaint || '',
        subjective: recordToEdit.subjective || '',
        objective: recordToEdit.objective || '',
        assessment: recordToEdit.assessment || '',
        plan: recordToEdit.plan || '',
        vital_signs: recordToEdit.vital_signs || {},
        attachments: recordToEdit.attachments || []
      })
      setPrescriptions(recordToEdit.prescriptions?.map((p: any) => ({
        medication_name: p.medication_name,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration || '',
        quantity: p.quantity || '',
        instructions: p.instructions || '',
        status: p.status || 'active'
      })) || [])
      setDiagnoses(recordToEdit.diagnoses?.map((d: any) => ({
        diagnosis_name: d.diagnosis_name,
        diagnosis_code: d.diagnosis_code || '',
        diagnosis_type: d.diagnosis_type || 'primary',
        severity: d.severity || 'moderate',
        notes: d.notes || '',
        status: d.status || 'active'
      })) || [])
    }
  }, [recordToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        patient_id: patientId,
        tenant_id: tenantId,
        doctor_id: doctorId,
        doctor_name: doctorName,
        created_by: doctorId,
        updated_by: doctorId,
        prescriptions,
        diagnoses
      }

      const url = recordToEdit
        ? `/api/patients/${patientId}/medical-records/${recordToEdit.id}`
        : `/api/patients/${patientId}/medical-records`

      const method = recordToEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Failed to ${recordToEdit ? 'update' : 'create'} medical record`)
      }

      // Reset form
      setFormData({
        record_type: 'consultation',
        record_date: new Date().toISOString().split('T')[0],
        chief_complaint: '',
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        vital_signs: {},
        attachments: []
      })
      setPrescriptions([])
      setDiagnoses([])

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating medical record:', error)
      alert('Error al crear el registro médico. Por favor intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const addPrescription = () => {
    setPrescriptions([...prescriptions, {
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: '',
      instructions: ''
    }])
  }

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index))
  }

  const updatePrescription = (index: number, field: keyof PrescriptionFormData, value: string) => {
    const updated = [...prescriptions]
    updated[index] = { ...updated[index], [field]: value }
    setPrescriptions(updated)
  }

  const addDiagnosis = () => {
    setDiagnoses([...diagnoses, {
      diagnosis_name: '',
      diagnosis_code: '',
      severity: 'mild',
      notes: '',
      status: 'active'
    }])
  }

  const removeDiagnosis = (index: number) => {
    setDiagnoses(diagnoses.filter((_, i) => i !== index))
  }

  const updateDiagnosis = (index: number, field: keyof DiagnosisFormData, value: any) => {
    const updated = [...diagnoses]
    updated[index] = { ...updated[index], [field]: value }
    setDiagnoses(updated)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {recordToEdit ? 'Editar Registro Médico' : 'Nuevo Registro Médico'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">Complete la información del registro</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-blue-700 rounded-full transition-colors"
                >
                  <Icons.x className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="border-b border-gray-200 bg-gray-50">
              <div className="flex space-x-4 px-6">
                <button
                  onClick={() => setActiveSection('basic')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeSection === 'basic'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Información Básica
                </button>
                <button
                  onClick={() => setActiveSection('vitals')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeSection === 'vitals'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Signos Vitales
                </button>
                <button
                  onClick={() => setActiveSection('prescriptions')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeSection === 'prescriptions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Recetas ({prescriptions.length})
                </button>
                <button
                  onClick={() => setActiveSection('diagnoses')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm ${
                    activeSection === 'diagnoses'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Diagnósticos ({diagnoses.length})
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
                {activeSection === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo de Registro *
                        </label>
                        <select
                          required
                          value={formData.record_type}
                          onChange={(e) => setFormData({ ...formData, record_type: e.target.value as RecordType })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="consultation">Consulta</option>
                          <option value="treatment">Tratamiento</option>
                          <option value="diagnosis">Diagnóstico</option>
                          <option value="lab_result">Resultado de Laboratorio</option>
                          <option value="imaging">Imagenología</option>
                          <option value="surgery">Cirugía</option>
                          <option value="vaccination">Vacunación</option>
                          <option value="note">Nota</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.record_date}
                          onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motivo de Consulta
                      </label>
                      <textarea
                        rows={2}
                        value={formData.chief_complaint}
                        onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="¿Por qué acude el paciente?"
                      />
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas SOAP</h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="text-blue-600 font-bold">S</span> Subjetivo
                          </label>
                          <textarea
                            rows={3}
                            value={formData.subjective}
                            onChange={(e) => setFormData({ ...formData, subjective: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Síntomas reportados por el paciente, historia del presente..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="text-green-600 font-bold">O</span> Objetivo
                          </label>
                          <textarea
                            rows={3}
                            value={formData.objective}
                            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Hallazgos del examen físico, observaciones clínicas..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="text-purple-600 font-bold">A</span> Evaluación/Assessment
                          </label>
                          <textarea
                            rows={3}
                            value={formData.assessment}
                            onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Diagnóstico o impresión clínica..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="text-orange-600 font-bold">P</span> Plan
                          </label>
                          <textarea
                            rows={3}
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Plan de tratamiento, seguimiento, recomendaciones..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'vitals' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Signos Vitales</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Temperatura (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.vital_signs?.temperature || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, temperature: parseFloat(e.target.value) || undefined }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="36.5"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frecuencia Cardíaca (bpm)
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.heart_rate || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, heart_rate: parseInt(e.target.value) || undefined }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="72"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Presión Sistólica
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.blood_pressure_systolic || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, blood_pressure_systolic: parseInt(e.target.value) || undefined }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="120"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Presión Diastólica
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.blood_pressure_diastolic || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, blood_pressure_diastolic: parseInt(e.target.value) || undefined }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="80"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.vital_signs?.weight || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, weight: parseFloat(e.target.value) || undefined }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="70"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Altura (cm)
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.height || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, height: parseInt(e.target.value) || undefined }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="170"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Saturación O₂ (%)
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.oxygen_saturation || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, oxygen_saturation: parseInt(e.target.value) || undefined }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="98"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frecuencia Respiratoria
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.respiratory_rate || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            vital_signs: { ...formData.vital_signs, respiratory_rate: parseInt(e.target.value) || undefined }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          placeholder="16"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'prescriptions' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Recetas Médicas</h3>
                      <button
                        type="button"
                        onClick={addPrescription}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
                      >
                        <Icons.plus className="w-4 h-4" />
                        Agregar Receta
                      </button>
                    </div>

                    {prescriptions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No hay recetas agregadas. Haz clic en "Agregar Receta" para comenzar.
                      </div>
                    ) : (
                      prescriptions.map((prescription, index) => (
                        <div key={index} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">Receta #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removePrescription(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Icons.trash className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Medicamento *
                              </label>
                              <input
                                type="text"
                                required
                                value={prescription.medication_name}
                                onChange={(e) => updatePrescription(index, 'medication_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Ej: Paracetamol"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dosis *
                              </label>
                              <input
                                type="text"
                                required
                                value={prescription.dosage}
                                onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Ej: 500mg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Frecuencia *
                              </label>
                              <input
                                type="text"
                                required
                                value={prescription.frequency}
                                onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Ej: Cada 8 horas"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duración
                              </label>
                              <input
                                type="text"
                                value={prescription.duration}
                                onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Ej: 7 días"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cantidad
                              </label>
                              <input
                                type="text"
                                value={prescription.quantity}
                                onChange={(e) => updatePrescription(index, 'quantity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Ej: 20 tabletas"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Instrucciones
                              </label>
                              <textarea
                                rows={2}
                                value={prescription.instructions}
                                onChange={(e) => updatePrescription(index, 'instructions', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                                placeholder="Ej: Tomar con alimentos"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeSection === 'diagnoses' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Diagnósticos</h3>
                      <button
                        type="button"
                        onClick={addDiagnosis}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2"
                      >
                        <Icons.plus className="w-4 h-4" />
                        Agregar Diagnóstico
                      </button>
                    </div>

                    {diagnoses.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No hay diagnósticos agregados. Haz clic en "Agregar Diagnóstico" para comenzar.
                      </div>
                    ) : (
                      diagnoses.map((diagnosis, index) => (
                        <div key={index} className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">Diagnóstico #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeDiagnosis(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Icons.trash className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Diagnóstico *
                              </label>
                              <input
                                type="text"
                                required
                                value={diagnosis.diagnosis_name}
                                onChange={(e) => updateDiagnosis(index, 'diagnosis_name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ej: Hipertensión arterial"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Código ICD-10
                              </label>
                              <input
                                type="text"
                                value={diagnosis.diagnosis_code}
                                onChange={(e) => updateDiagnosis(index, 'diagnosis_code', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ej: I10"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Severidad
                              </label>
                              <select
                                value={diagnosis.severity}
                                onChange={(e) => updateDiagnosis(index, 'severity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="mild">Leve</option>
                                <option value="moderate">Moderado</option>
                                <option value="severe">Severo</option>
                                <option value="critical">Crítico</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado
                              </label>
                              <select
                                value={diagnosis.status}
                                onChange={(e) => updateDiagnosis(index, 'status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="active">Activo</option>
                                <option value="resolved">Resuelto</option>
                                <option value="chronic">Crónico</option>
                                <option value="ruled_out">Descartado</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Notas
                              </label>
                              <textarea
                                rows={2}
                                value={diagnosis.notes}
                                onChange={(e) => updateDiagnosis(index, 'notes', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Notas adicionales sobre el diagnóstico"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {recordToEdit ? 'Actualizando...' : 'Guardando...'}
                      </>
                    ) : (
                      <>
                        <Icons.checkCircle className="w-4 h-4" />
                        {recordToEdit ? 'Actualizar Registro' : 'Guardar Registro'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
