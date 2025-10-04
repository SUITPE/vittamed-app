// Medical History Types

export type RecordType =
  | 'consultation'
  | 'treatment'
  | 'diagnosis'
  | 'prescription'
  | 'lab_result'
  | 'imaging'
  | 'surgery'
  | 'vaccination'
  | 'note'

export type DiagnosisType = 'primary' | 'secondary' | 'differential'
export type Severity = 'mild' | 'moderate' | 'severe' | 'critical' | 'life_threatening'
export type DiagnosisStatus = 'active' | 'resolved' | 'chronic' | 'ruled_out'
export type PrescriptionStatus = 'active' | 'completed' | 'cancelled' | 'refilled'
export type AllergyType = 'medication' | 'food' | 'environmental' | 'other'
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'file'

export interface VitalSigns {
  temperature?: number // Celsius
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  heart_rate?: number // bpm
  respiratory_rate?: number
  oxygen_saturation?: number // %
  weight?: number // kg
  height?: number // cm
  bmi?: number
  [key: string]: any // Allow custom vital signs
}

export interface Attachment {
  type: 'image' | 'pdf' | 'document' | 'other'
  url: string
  name: string
  size?: number
  uploaded_at?: string
}

export interface MedicalRecord {
  id: string
  patient_id: string
  tenant_id: string
  appointment_id: string | null

  // Record metadata
  record_type: RecordType
  record_date: string

  // Medical professional
  doctor_id: string | null
  doctor_name: string | null

  // SOAP notes
  chief_complaint: string | null
  subjective: string | null // History of present illness
  objective: string | null // Physical exam
  assessment: string | null // Diagnosis
  plan: string | null // Treatment plan

  // Measurements
  vital_signs: VitalSigns

  // Tenant-specific data
  tenant_specific_data: Record<string, any>

  // Attachments
  attachments: Attachment[]

  // Privacy
  is_visible: boolean
  allow_cross_tenant_viewing: boolean

  // Audit
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface Prescription {
  id: string
  medical_record_id: string
  patient_id: string
  tenant_id: string

  medication_name: string
  dosage: string
  frequency: string
  duration: string | null
  quantity: string | null
  instructions: string | null

  status: PrescriptionStatus

  prescribed_by: string | null
  prescribed_at: string

  created_at: string
  updated_at: string
}

export interface Diagnosis {
  id: string
  medical_record_id: string
  patient_id: string
  tenant_id: string

  diagnosis_code: string | null // ICD-10
  diagnosis_name: string
  diagnosis_type: DiagnosisType | null
  severity: Severity | null
  notes: string | null

  status: DiagnosisStatus
  diagnosed_date: string
  resolved_date: string | null

  diagnosed_by: string | null

  created_at: string
  updated_at: string
}

export interface PatientAllergy {
  id: string
  patient_id: string
  tenant_id: string

  allergen: string
  allergy_type: AllergyType
  reaction: string | null
  severity: Severity | null
  notes: string | null

  is_active: boolean
  first_observed: string | null

  created_at: string
  updated_at: string
}

export interface Vaccination {
  id: string
  patient_id: string
  tenant_id: string
  medical_record_id: string | null

  vaccine_name: string
  vaccine_type: string | null
  dose_number: number | null
  lot_number: string | null
  administration_date: string
  next_dose_date: string | null
  site: string | null
  route: string | null
  notes: string | null

  administered_by: string | null

  created_at: string
  updated_at: string
}

export interface PatientMedicalSummary {
  id: string
  patient_id: string
  tenant_id: string

  chronic_conditions: string[]
  active_medications: string[]
  known_allergies: string[]
  blood_type: string | null

  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null

  insurance_provider: string | null
  insurance_policy_number: string | null

  special_notes: string | null

  last_updated: string
  created_at: string
}

export interface MedicalRecordFieldConfig {
  id: string
  tenant_id: string
  tenant_type: string

  field_key: string
  field_label: string
  field_type: FieldType
  field_options: string[] | null
  is_required: boolean
  display_order: number
  category: string | null

  is_active: boolean
  created_at: string
}

// Extended types with relations
export interface MedicalRecordWithRelations extends MedicalRecord {
  prescriptions?: Prescription[]
  diagnoses?: Diagnosis[]
  patient?: {
    id: string
    first_name: string
    last_name: string
    email: string
    date_of_birth?: string
  }
  doctor?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export interface PatientWithMedicalHistory {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  medical_records: MedicalRecordWithRelations[]
  medical_summary: PatientMedicalSummary | null
  allergies: PatientAllergy[]
  vaccinations: Vaccination[]
}

// Form data types
export interface MedicalRecordFormData {
  record_type: RecordType
  record_date: string
  chief_complaint?: string
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  vital_signs?: Partial<VitalSigns>
  tenant_specific_data?: Record<string, any>
  attachments?: Attachment[]
}

export interface PrescriptionFormData {
  medication_name: string
  dosage: string
  frequency: string
  duration?: string
  quantity?: string
  instructions?: string
}

export interface DiagnosisFormData {
  diagnosis_code?: string
  diagnosis_name: string
  diagnosis_type?: DiagnosisType
  severity?: Severity
  notes?: string
  status: DiagnosisStatus
}

export interface AllergyFormData {
  allergen: string
  allergy_type: AllergyType
  reaction?: string
  severity?: Severity
  notes?: string
  first_observed?: string
}

// UI Configuration
export const RECORD_TYPE_CONFIG: Record<RecordType, {
  label: string
  icon: string
  color: string
}> = {
  consultation: {
    label: 'Consulta',
    icon: '👨‍⚕️',
    color: 'blue'
  },
  treatment: {
    label: 'Tratamiento',
    icon: '💊',
    color: 'green'
  },
  diagnosis: {
    label: 'Diagnóstico',
    icon: '🔬',
    color: 'purple'
  },
  prescription: {
    label: 'Receta',
    icon: '📋',
    color: 'indigo'
  },
  lab_result: {
    label: 'Resultado de Lab',
    icon: '🧪',
    color: 'cyan'
  },
  imaging: {
    label: 'Imagenología',
    icon: '📷',
    color: 'teal'
  },
  surgery: {
    label: 'Cirugía',
    icon: '🏥',
    color: 'red'
  },
  vaccination: {
    label: 'Vacunación',
    icon: '💉',
    color: 'yellow'
  },
  note: {
    label: 'Nota',
    icon: '📝',
    color: 'gray'
  }
}

export const SEVERITY_CONFIG: Record<Severity, {
  label: string
  color: string
}> = {
  mild: { label: 'Leve', color: 'green' },
  moderate: { label: 'Moderado', color: 'yellow' },
  severe: { label: 'Severo', color: 'orange' },
  critical: { label: 'Crítico', color: 'red' },
  life_threatening: { label: 'Potencialmente Mortal', color: 'red' }
}

export const ALLERGY_TYPE_CONFIG: Record<AllergyType, {
  label: string
  icon: string
}> = {
  medication: { label: 'Medicamento', icon: '💊' },
  food: { label: 'Alimento', icon: '🍽️' },
  environmental: { label: 'Ambiental', icon: '🌿' },
  other: { label: 'Otro', icon: '⚠️' }
}
