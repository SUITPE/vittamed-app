'use client'

import { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'
import { VoiceDictation } from '@/components/medical/VoiceDictation'
import SpecialtyFields from '@/components/medical/SpecialtyFields'
import { DiagnosisSuggestions } from '@/components/medical/DiagnosisSuggestions'
import { useDiagnosisSuggestions, type DiagnosisSuggestion } from '@/hooks/useDiagnosisSuggestions'
import { getFieldsForSpecialty, getSpecialtyFromTenantType, getTerminologyForSpecialty, SPECIALTY_CONFIG } from '@/lib/medical-fields'
import type { RecordType, MedicalRecordFormData, PrescriptionFormData, DiagnosisFormData } from '@/types/medical-history'

interface MedicalRecordFormProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  tenantId: string
  tenantType?: string // For specialty-specific fields
  doctorId: string
  doctorName: string
  recordToEdit?: any // For future edit functionality
  onSuccess: () => void
}

// Rangos normales de signos vitales (adultos)
const VITAL_RANGES = {
  temperature: { min: 36.1, max: 37.2, unit: '°C', label: 'Temperatura' },
  heart_rate: { min: 60, max: 100, unit: 'bpm', label: 'Frecuencia Cardíaca' },
  blood_pressure_systolic: { min: 90, max: 120, unit: 'mmHg', label: 'Presión Sistólica' },
  blood_pressure_diastolic: { min: 60, max: 80, unit: 'mmHg', label: 'Presión Diastólica' },
  respiratory_rate: { min: 12, max: 20, unit: 'rpm', label: 'Frecuencia Respiratoria' },
  oxygen_saturation: { min: 95, max: 100, unit: '%', label: 'Saturación O₂' },
  weight: { min: 40, max: 200, unit: 'kg', label: 'Peso' }, // Rango amplio
  height: { min: 140, max: 220, unit: 'cm', label: 'Altura' } // Rango amplio
}

type VitalSign = keyof typeof VITAL_RANGES

/**
 * Parser inteligente para extraer información clínica del dictado
 * Extrae: Motivo de consulta, Subjetivo, Objetivo, Evaluación y Plan
 */
function parseMedicalDictation(text: string) {
  console.log('[Medical Parser] Input text:', text)

  const result: {
    chief_complaint?: string
    subjective?: string
    objective?: string
    assessment?: string
    plan?: string
  } = {}

  // Normalizar texto para búsqueda
  const normalized = text.toLowerCase()

  // ==========================================
  // 1. EXTRAER MOTIVO DE CONSULTA (Chief Complaint)
  // ==========================================
  // Patrones para identificar el motivo de consulta
  const chiefComplaintPatterns = [
    /(?:motivo de consulta|motivo de la consulta)[:\s]+([^.]+)/i,
    /(?:acude por|consulta por|viene por)[:\s]*([^.]+)/i,
    /(?:paciente (?:acude|viene|consulta) (?:por|debido a|a causa de))[:\s]*([^.]+)/i,
    /(?:el motivo (?:es|de la visita))[:\s]*([^.]+)/i,
  ]

  for (const pattern of chiefComplaintPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      result.chief_complaint = match[1].trim()
      break
    }
  }

  // Si no hay motivo explícito, extraer de la primera mención de síntomas
  if (!result.chief_complaint) {
    const symptomPatterns = [
      /(?:refiere|presenta|tiene|siente)[:\s]*([^.]{10,80})/i,
      /(?:dolor|molestia|sensibilidad|inflamación|sangrado)[^.]{0,50}/i,
    ]

    for (const pattern of symptomPatterns) {
      const match = text.match(pattern)
      if (match) {
        // Tomar la primera parte como motivo de consulta (máx 100 chars)
        const complaint = match[0].substring(0, 100).trim()
        if (complaint.length > 10) {
          result.chief_complaint = complaint
          break
        }
      }
    }
  }

  // ==========================================
  // 2. DIVIDIR EN SECCIONES POR MARCADORES
  // ==========================================
  const sectionMarkers = {
    subjective: {
      patterns: [
        /(?:subjetivo|anamnesis)[:\s]*/i,
        /(?:paciente refiere|el paciente refiere|la paciente refiere)[:\s]*/i,
        /(?:refiere que|manifiesta que|comenta que)[:\s]*/i,
        /(?:historia de la enfermedad|antecedentes)[:\s]*/i,
      ],
      keywords: ['refiere', 'manifiesta', 'siente', 'tiene', 'desde hace', 'comenzó', 'empezó', 'síntomas']
    },
    objective: {
      patterns: [
        /(?:objetivo|examen físico|examen clínico|exploración)[:\s]*/i,
        /(?:al examen|a la exploración|se observa|se evidencia)[:\s]*/i,
        /(?:hallazgos|signos vitales)[:\s]*/i,
      ],
      keywords: ['se observa', 'se evidencia', 'presenta', 'exploración', 'palpación', 'auscultación', 'inspección', 'radiografía', 'rx', 'sondaje']
    },
    assessment: {
      patterns: [
        /(?:evaluación|assessment|diagnóstico|impresión diagnóstica|dx)[:\s]*/i,
        /(?:se diagnostica|diagnóstico probable|impresión clínica)[:\s]*/i,
      ],
      keywords: ['diagnóstico', 'dx', 'impresión', 'se diagnostica', 'compatible con', 'sugestivo de']
    },
    plan: {
      patterns: [
        /(?:plan|tratamiento|indicaciones|recomendaciones)[:\s]*/i,
        /(?:se recomienda|se indica|se prescribe|plan de tratamiento)[:\s]*/i,
        /(?:procedimiento a realizar|se procederá)[:\s]*/i,
      ],
      keywords: ['se recomienda', 'se indica', 'tratamiento', 'medicación', 'control', 'cita', 'procedimiento', 'aplicar', 'tomar']
    }
  }

  // Encontrar posiciones de secciones explícitas
  const sections: { type: keyof typeof sectionMarkers; start: number; matchLength: number }[] = []

  for (const [sectionType, config] of Object.entries(sectionMarkers)) {
    for (const pattern of config.patterns) {
      const match = normalized.match(pattern)
      if (match && match.index !== undefined) {
        sections.push({
          type: sectionType as keyof typeof sectionMarkers,
          start: match.index,
          matchLength: match[0].length
        })
        break // Solo tomar el primer match por sección
      }
    }
  }

  // Si hay secciones explícitas, extraer por posición
  if (sections.length > 0) {
    sections.sort((a, b) => a.start - b.start)

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      const startContent = section.start + section.matchLength
      const endContent = i < sections.length - 1 ? sections[i + 1].start : text.length
      const content = text.substring(startContent, endContent).trim()

      if (content && content.length > 5) {
        result[section.type] = content
      }
    }
  }

  // ==========================================
  // 3. PARSING SEMÁNTICO POR ORACIONES
  // ==========================================
  // Dividir en oraciones y clasificar las que no fueron capturadas
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10)

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase()

    // Verificar si ya está incluida en algún resultado
    const alreadyIncluded = Object.values(result).some(v => v && v.toLowerCase().includes(lower))
    if (alreadyIncluded) continue

    // Clasificar por keywords
    if (sectionMarkers.plan.keywords.some(k => lower.includes(k))) {
      result.plan = (result.plan ? result.plan + ' ' : '') + sentence + '.'
    } else if (sectionMarkers.assessment.keywords.some(k => lower.includes(k))) {
      result.assessment = (result.assessment ? result.assessment + ' ' : '') + sentence + '.'
    } else if (sectionMarkers.objective.keywords.some(k => lower.includes(k))) {
      result.objective = (result.objective ? result.objective + ' ' : '') + sentence + '.'
    } else if (sectionMarkers.subjective.keywords.some(k => lower.includes(k))) {
      result.subjective = (result.subjective ? result.subjective + ' ' : '') + sentence + '.'
    }
  }

  // ==========================================
  // 4. FALLBACK: Si no hay nada estructurado
  // ==========================================
  if (!result.subjective && !result.objective && !result.assessment && !result.plan) {
    // Poner todo en subjetivo si no se pudo clasificar
    result.subjective = text.trim()
  }

  // Si hay subjetivo pero no motivo de consulta, usar primera oración del subjetivo
  if (!result.chief_complaint && result.subjective) {
    const firstSentence = result.subjective.split(/[.!?]/)[0]?.trim()
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 150) {
      result.chief_complaint = firstSentence
    }
  }

  // ==========================================
  // 5. LIMPIAR RESULTADOS
  // ==========================================
  for (const key of Object.keys(result) as (keyof typeof result)[]) {
    if (result[key]) {
      // Limpiar espacios múltiples y trim
      result[key] = result[key]!.trim().replace(/\s+/g, ' ')
      // Capitalizar primera letra
      result[key] = result[key]!.charAt(0).toUpperCase() + result[key]!.slice(1)
    }
  }

  console.log('[Medical Parser] Parsed result:', result)
  return result
}

export default function MedicalRecordForm({
  isOpen,
  onClose,
  patientId,
  tenantId,
  tenantType = 'clinic',
  doctorId,
  doctorName,
  recordToEdit,
  onSuccess
}: MedicalRecordFormProps) {
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState<'basic' | 'vitals' | 'specialty' | 'prescriptions' | 'diagnoses'>('basic')
  const [vitalWarnings, setVitalWarnings] = useState<Record<string, string>>({})

  // Specialty-specific fields and terminology
  const specialty = getSpecialtyFromTenantType(tenantType)
  const specialtyFields = getFieldsForSpecialty(specialty)
  const specialtyInfo = SPECIALTY_CONFIG[specialty]
  const terminology = getTerminologyForSpecialty(specialty)
  const [specialtyData, setSpecialtyData] = useState<Record<string, unknown>>({})

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

  // Hook de sugerencias de diagnóstico con IA
  const {
    suggestions: diagnosisSuggestions,
    disclaimer: diagnosisDisclaimer,
    isLoading: isLoadingSuggestions,
    getSuggestions,
    clearSuggestions,
    selectDiagnosis,
    selectedDiagnosis
  } = useDiagnosisSuggestions()

  // Función para extraer síntomas del texto del dictado
  const extractSymptomsFromText = (text: string): string[] => {
    // Patrones para identificar síntomas en español
    const symptomPatterns = [
      /(?:presenta|refiere|tiene|siente|padece)\s+(?:de\s+)?([^,.;]+)/gi,
      /(?:dolor|molestia|malestar|sensibilidad|inflamación|sangrado|fiebre|tos|náuseas|vómitos|diarrea|mareo|fatiga|debilidad|ardor)\s*(?:de|en)?\s*([^,.;]*)/gi,
    ]

    const symptoms: string[] = []

    // Extraer síntomas usando patrones
    for (const pattern of symptomPatterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const symptom = match[0].trim()
        if (symptom.length > 3 && !symptoms.includes(symptom)) {
          symptoms.push(symptom)
        }
      }
    }

    // Si no se encontraron síntomas con patrones, usar el texto completo dividido en oraciones
    if (symptoms.length === 0 && text.trim().length > 10) {
      const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10)
      symptoms.push(...sentences.slice(0, 3)) // Máximo 3 oraciones como síntomas
    }

    return symptoms.slice(0, 5) // Máximo 5 síntomas
  }

  // Función para manejar selección de diagnóstico sugerido
  const handleSelectDiagnosis = (suggestion: DiagnosisSuggestion) => {
    // Actualizar el campo assessment con el diagnóstico
    setFormData(prev => ({
      ...prev,
      assessment: suggestion.diagnosis + (suggestion.icd10Code ? ` (${suggestion.icd10Code})` : '') +
        (prev.assessment ? '\n\n' + prev.assessment : '')
    }))

    // Agregar a la lista de diagnósticos con código CIE-10
    const newDiagnosis: DiagnosisFormData = {
      diagnosis_name: suggestion.diagnosis,
      diagnosis_code: suggestion.icd10Code || '',
      diagnosis_type: diagnoses.length === 0 ? 'primary' : 'secondary',
      severity: suggestion.confidence === 'high' ? 'severe' :
                suggestion.confidence === 'medium' ? 'moderate' : 'mild',
      notes: suggestion.reasoning,
      status: 'active'
    }

    setDiagnoses(prev => [...prev, newDiagnosis])
    selectDiagnosis(suggestion)
  }

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
      // Load specialty-specific data
      setSpecialtyData(recordToEdit.tenant_specific_data || {})
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
        tenant_specific_data: specialtyData,
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
      setSpecialtyData({})

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

  // Validar signos vitales
  const validateVitalSign = (field: VitalSign, value: number) => {
    const range = VITAL_RANGES[field]
    if (!value || !range) return null

    if (value < range.min) {
      return `⚠️ Valor bajo - Rango normal: ${range.min}-${range.max} ${range.unit}`
    }
    if (value > range.max) {
      return `⚠️ Valor alto - Rango normal: ${range.min}-${range.max} ${range.unit}`
    }
    return null
  }

  // Actualizar warnings cuando cambien los signos vitales
  const updateVitalSign = (field: VitalSign, value: number | undefined) => {
    setFormData({
      ...formData,
      vital_signs: { ...formData.vital_signs, [field]: value }
    })

    // Validar y actualizar warnings
    if (value) {
      const warning = validateVitalSign(field, value)
      if (warning) {
        setVitalWarnings({ ...vitalWarnings, [field]: warning })
      } else {
        const { [field]: removed, ...rest } = vitalWarnings
        setVitalWarnings(rest)
      }
    } else {
      const { [field]: removed, ...rest } = vitalWarnings
      setVitalWarnings(rest)
    }
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
                    {recordToEdit ? `Editar ${terminology.recordLabel}` : `Nueva ${terminology.recordLabel}`}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">Complete la información del {terminology.patientLabel.toLowerCase()}</p>
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
                {terminology.showVitals && (
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
                )}
                {specialtyFields.length > 0 && (
                  <button
                    onClick={() => setActiveSection('specialty')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeSection === 'specialty'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {specialtyInfo.icon} {specialtyInfo.name}
                  </button>
                )}
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
                        {terminology.chiefComplaintLabel}
                      </label>
                      <textarea
                        rows={2}
                        value={formData.chief_complaint}
                        onChange={(e) => setFormData({ ...formData, chief_complaint: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={terminology.chiefComplaintPlaceholder}
                      />
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Notas Clínicas</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Dictar notas:</span>
                          <VoiceDictation
                            onTranscriptionComplete={(text) => {
                              // Parser inteligente para mapear dictado a campos médicos
                              const parsed = parseMedicalDictation(text)
                              setFormData(prev => ({
                                ...prev,
                                chief_complaint: parsed.chief_complaint || prev.chief_complaint,
                                subjective: parsed.subjective || prev.subjective,
                                objective: parsed.objective || prev.objective,
                                assessment: parsed.assessment || prev.assessment,
                                plan: parsed.plan || prev.plan
                              }))

                              // Extraer síntomas y solicitar sugerencias de diagnóstico con IA
                              const symptoms = extractSymptomsFromText(text)
                              if (symptoms.length > 0) {
                                clearSuggestions() // Limpiar sugerencias anteriores
                                getSuggestions({
                                  symptoms,
                                  clinicalText: text,
                                  maxSuggestions: 3
                                })
                              }
                            }}
                            variant="compact"
                            language="es-ES"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="text-blue-600 font-bold">S</span> {terminology.subjectiveLabel}
                          </label>
                          <textarea
                            rows={3}
                            value={formData.subjective}
                            onChange={(e) => setFormData({ ...formData, subjective: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder={terminology.subjectivePlaceholder}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="text-green-600 font-bold">O</span> {terminology.objectiveLabel}
                          </label>
                          <textarea
                            rows={3}
                            value={formData.objective}
                            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder={terminology.objectivePlaceholder}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="text-purple-600 font-bold">A</span> {terminology.assessmentLabel}
                          </label>
                          <textarea
                            rows={3}
                            value={formData.assessment}
                            onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder={terminology.assessmentPlaceholder}
                          />
                        </div>

                        {/* Sugerencias de diagnóstico con IA y CIE-10 */}
                        {(diagnosisSuggestions.length > 0 || isLoadingSuggestions) && (
                          <div className="mt-4">
                            <DiagnosisSuggestions
                              suggestions={diagnosisSuggestions}
                              disclaimer={diagnosisDisclaimer || undefined}
                              onSelect={handleSelectDiagnosis}
                              selectedCode={selectedDiagnosis?.icd10Code || undefined}
                              isLoading={isLoadingSuggestions}
                              showDifferentials={true}
                              showRecommendedTests={true}
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <span className="text-orange-600 font-bold">P</span> {terminology.planLabel}
                          </label>
                          <textarea
                            rows={3}
                            value={formData.plan}
                            onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder={terminology.planPlaceholder}
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
                          onChange={(e) => updateVitalSign('temperature', parseFloat(e.target.value) || undefined)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            vitalWarnings.temperature ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
                          }`}
                          placeholder="36.5"
                        />
                        {vitalWarnings.temperature && (
                          <p className="mt-1 text-sm text-yellow-700">{vitalWarnings.temperature}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frecuencia Cardíaca (bpm)
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.heart_rate || ''}
                          onChange={(e) => updateVitalSign('heart_rate', parseInt(e.target.value) || undefined)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            vitalWarnings.heart_rate ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
                          }`}
                          placeholder="72"
                        />
                        {vitalWarnings.heart_rate && (
                          <p className="mt-1 text-sm text-yellow-700">{vitalWarnings.heart_rate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Presión Sistólica
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.blood_pressure_systolic || ''}
                          onChange={(e) => updateVitalSign('blood_pressure_systolic', parseInt(e.target.value) || undefined)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            vitalWarnings.blood_pressure_systolic ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
                          }`}
                          placeholder="120"
                        />
                        {vitalWarnings.blood_pressure_systolic && (
                          <p className="mt-1 text-sm text-yellow-700">{vitalWarnings.blood_pressure_systolic}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Presión Diastólica
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.blood_pressure_diastolic || ''}
                          onChange={(e) => updateVitalSign('blood_pressure_diastolic', parseInt(e.target.value) || undefined)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            vitalWarnings.blood_pressure_diastolic ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
                          }`}
                          placeholder="80"
                        />
                        {vitalWarnings.blood_pressure_diastolic && (
                          <p className="mt-1 text-sm text-yellow-700">{vitalWarnings.blood_pressure_diastolic}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Peso (kg)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.vital_signs?.weight || ''}
                          onChange={(e) => updateVitalSign('weight', parseFloat(e.target.value) || undefined)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            vitalWarnings.weight ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
                          }`}
                          placeholder="70"
                        />
                        {vitalWarnings.weight && (
                          <p className="mt-1 text-sm text-yellow-700">{vitalWarnings.weight}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Altura (cm)
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.height || ''}
                          onChange={(e) => updateVitalSign('height', parseInt(e.target.value) || undefined)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            vitalWarnings.height ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
                          }`}
                          placeholder="170"
                        />
                        {vitalWarnings.height && (
                          <p className="mt-1 text-sm text-yellow-700">{vitalWarnings.height}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Saturación O₂ (%)
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.oxygen_saturation || ''}
                          onChange={(e) => updateVitalSign('oxygen_saturation', parseInt(e.target.value) || undefined)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            vitalWarnings.oxygen_saturation ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
                          }`}
                          placeholder="98"
                        />
                        {vitalWarnings.oxygen_saturation && (
                          <p className="mt-1 text-sm text-yellow-700">{vitalWarnings.oxygen_saturation}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frecuencia Respiratoria
                        </label>
                        <input
                          type="number"
                          value={formData.vital_signs?.respiratory_rate || ''}
                          onChange={(e) => updateVitalSign('respiratory_rate', parseInt(e.target.value) || undefined)}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            vitalWarnings.respiratory_rate ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
                          }`}
                          placeholder="16"
                        />
                        {vitalWarnings.respiratory_rate && (
                          <p className="mt-1 text-sm text-yellow-700">{vitalWarnings.respiratory_rate}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'specialty' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{specialtyInfo.icon}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Campos de {specialtyInfo.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Información específica para esta especialidad
                        </p>
                      </div>
                    </div>

                    <SpecialtyFields
                      fields={specialtyFields.filter(f => f.category !== 'vital_signs')}
                      formData={specialtyData}
                      onFieldChange={(fieldName, value) => {
                        setSpecialtyData(prev => ({ ...prev, [fieldName]: value }))
                      }}
                      showCategories={true}
                    />
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
