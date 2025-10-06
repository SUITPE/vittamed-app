-- Migration: Medical History System
-- Description: Comprehensive medical history tracking for patients with tenant-specific customization

-- =====================================================
-- 1. CREATE MEDICAL RECORDS TABLE
-- =====================================================
-- Main table for storing patient medical records
CREATE TABLE IF NOT EXISTS medical_records (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,

  -- Record metadata
  record_type text NOT NULL CHECK (record_type IN ('consultation', 'treatment', 'diagnosis', 'prescription', 'lab_result', 'imaging', 'surgery', 'vaccination', 'note')),
  record_date date NOT NULL DEFAULT CURRENT_DATE,

  -- Medical professional
  doctor_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  doctor_name text, -- Denormalized for historical accuracy

  -- General medical information (common across all tenant types)
  chief_complaint text, -- Motivo de consulta
  subjective text, -- Historia del presente (síntomas, duración, etc)
  objective text, -- Examen físico, signos vitales
  assessment text, -- Diagnóstico o impresión clínica
  plan text, -- Plan de tratamiento

  -- Vital signs (JSONB for flexibility)
  vital_signs jsonb DEFAULT '{}'::jsonb,
  -- Example: {"temperature": 36.5, "blood_pressure": "120/80", "heart_rate": 72, "weight": 70, "height": 170}

  -- Tenant-specific data (JSONB for maximum flexibility)
  tenant_specific_data jsonb DEFAULT '{}'::jsonb,

  -- Attachments and files
  attachments jsonb DEFAULT '[]'::jsonb,
  -- Example: [{"type": "image", "url": "...", "name": "X-ray.jpg"}, ...]

  -- Privacy and sharing
  is_visible boolean DEFAULT true,
  allow_cross_tenant_viewing boolean DEFAULT false, -- For future: patient authorization

  -- Audit fields
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 2. CREATE PRESCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_record_id uuid NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Prescription details
  medication_name text NOT NULL,
  dosage text NOT NULL, -- e.g., "500mg", "5ml"
  frequency text NOT NULL, -- e.g., "Cada 8 horas", "2 veces al día"
  duration text, -- e.g., "7 días", "2 semanas"
  quantity text, -- e.g., "20 tabletas"
  instructions text, -- e.g., "Tomar con alimentos"

  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'refilled')),

  -- Prescribed by
  prescribed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  prescribed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 3. CREATE DIAGNOSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  medical_record_id uuid NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Diagnosis information
  diagnosis_code text, -- ICD-10 or similar
  diagnosis_name text NOT NULL,
  diagnosis_type text CHECK (diagnosis_type IN ('primary', 'secondary', 'differential')),
  severity text CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
  notes text,

  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'chronic', 'ruled_out')),
  diagnosed_date date DEFAULT CURRENT_DATE,
  resolved_date date,

  -- Diagnosed by
  diagnosed_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 4. CREATE ALLERGIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS patient_allergies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  allergen text NOT NULL,
  allergy_type text CHECK (allergy_type IN ('medication', 'food', 'environmental', 'other')),
  reaction text, -- Description of reaction
  severity text CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
  notes text,

  -- Status
  is_active boolean DEFAULT true,
  first_observed date,

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(patient_id, allergen, allergy_type)
);

-- =====================================================
-- 5. CREATE VACCINATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vaccinations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  medical_record_id uuid REFERENCES medical_records(id) ON DELETE SET NULL,

  vaccine_name text NOT NULL,
  vaccine_type text, -- e.g., "COVID-19", "Influenza"
  dose_number integer, -- e.g., 1st dose, 2nd dose
  lot_number text,
  administration_date date NOT NULL,
  next_dose_date date,
  site text, -- e.g., "Left arm"
  route text, -- e.g., "Intramuscular"
  notes text,

  -- Administered by
  administered_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,

  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 6. CREATE MEDICAL HISTORY SUMMARY TABLE
-- =====================================================
-- Quick reference table for patient's ongoing medical conditions
CREATE TABLE IF NOT EXISTS patient_medical_summary (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Summary data (updated via triggers)
  chronic_conditions text[], -- Array of ongoing conditions
  active_medications text[], -- Current medications
  known_allergies text[], -- Known allergies
  blood_type text,

  -- Emergency contact
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,

  -- Insurance (optional)
  insurance_provider text,
  insurance_policy_number text,

  -- Additional notes
  special_notes text, -- e.g., "Diabético", "Hipertenso"

  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 7. CREATE TENANT-SPECIFIC FIELD CONFIGURATIONS
-- =====================================================
-- This table allows tenants to define custom fields for their medical records
CREATE TABLE IF NOT EXISTS medical_record_field_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tenant_type text NOT NULL, -- References tenant.tenant_type

  field_key text NOT NULL, -- e.g., "dental_tooth_number", "skin_condition_area"
  field_label text NOT NULL, -- Display name
  field_type text NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'date', 'select', 'multiselect', 'checkbox', 'file')),
  field_options jsonb, -- For select/multiselect: ["option1", "option2"]
  is_required boolean DEFAULT false,
  display_order integer DEFAULT 0,
  category text, -- For grouping fields in UI

  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(tenant_id, field_key)
);

-- =====================================================
-- 8. INSERT DEFAULT FIELD CONFIGURATIONS BY TENANT TYPE
-- =====================================================
-- Note: Field configs will be created dynamically per tenant
-- This is just a template for reference. Actual configs should be created
-- via API when tenant is created or when feature is enabled.

-- The following are example field configurations that can be inserted
-- for existing tenants via a separate admin tool or API endpoint:

/*
Example field configurations by tenant type:

Medical Clinic:
- previous_surgeries (textarea) - Cirugías Previas
- family_history (textarea) - Antecedentes Familiares
- current_medications (textarea) - Medicamentos Actuales

Dental Clinic:
- tooth_number (text) - Número de Diente
- procedure_type (select) - Tipo de Procedimiento
- dental_condition (select) - Condición Dental

Physiotherapy:
- affected_area (text) - Área Afectada
- mobility_level (select) - Nivel de Movilidad
- pain_level (number) - Nivel de Dolor (1-10)
- exercise_plan (textarea) - Plan de Ejercicios

Psychology:
- presenting_issue (textarea) - Motivo de Consulta Principal
- mental_status (select) - Estado Mental
- therapy_approach (select) - Enfoque Terapéutico
- homework_assignment (textarea) - Tarea Asignada

Veterinary:
- species (select) - Especie
- breed (text) - Raza
- neutered (checkbox) - Esterilizado/Castrado
- vaccination_status (textarea) - Estado de Vacunación
*/

-- =====================================================
-- 9. CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_tenant ON medical_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment ON medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records(record_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON medical_records(record_type);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_record ON prescriptions(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);

CREATE INDEX IF NOT EXISTS idx_diagnoses_patient ON diagnoses(patient_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_record ON diagnoses(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_diagnoses_status ON diagnoses(status);

CREATE INDEX IF NOT EXISTS idx_allergies_patient ON patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_allergies_active ON patient_allergies(patient_id, is_active);

CREATE INDEX IF NOT EXISTS idx_vaccinations_patient ON vaccinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_date ON vaccinations(administration_date);

CREATE INDEX IF NOT EXISTS idx_field_configs_tenant ON medical_record_field_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_field_configs_type ON medical_record_field_configs(tenant_type);

-- =====================================================
-- 10. CREATE TRIGGER FOR AUTO-CREATING MEDICAL RECORD ON APPOINTMENT COMPLETION
-- =====================================================
CREATE OR REPLACE FUNCTION create_medical_record_on_appointment_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create medical record when appointment is marked as 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    INSERT INTO medical_records (
      patient_id,
      tenant_id,
      appointment_id,
      record_type,
      record_date,
      doctor_id,
      doctor_name,
      created_by
    ) VALUES (
      NEW.patient_id,
      NEW.tenant_id,
      NEW.id,
      'consultation',
      NEW.appointment_date,
      NEW.doctor_id,
      NEW.doctor_name,
      NEW.doctor_id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_medical_record_on_appointment_completion
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION create_medical_record_on_appointment_completion();

-- =====================================================
-- 11. CREATE RLS POLICIES
-- =====================================================
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medical_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_record_field_configs ENABLE ROW LEVEL SECURITY;

-- Medical Records: Viewable by tenant members and patient themselves
CREATE POLICY "Medical records viewable by tenant members" ON medical_records
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
    OR
    patient_id IN (
      SELECT id FROM patients WHERE email = (
        SELECT email FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

-- Medical Records: Only doctors and admins can create/update
CREATE POLICY "Only doctors can modify medical records" ON medical_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND tenant_id = medical_records.tenant_id
      AND role IN ('doctor', 'admin_tenant', 'super_admin')
    )
  );

-- Similar policies for related tables
CREATE POLICY "Prescriptions viewable by tenant members" ON prescriptions
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Diagnoses viewable by tenant members" ON diagnoses
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Allergies viewable by tenant members" ON patient_allergies
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE medical_records IS 'Stores comprehensive medical records for patients with tenant-specific customization';
COMMENT ON TABLE prescriptions IS 'Electronic prescription records linked to medical records';
COMMENT ON TABLE diagnoses IS 'Patient diagnoses with ICD codes and status tracking';
COMMENT ON TABLE patient_allergies IS 'Patient allergy information for safety';
COMMENT ON TABLE vaccinations IS 'Vaccination records for patients';
COMMENT ON TABLE patient_medical_summary IS 'Quick reference summary of patient medical information';
COMMENT ON TABLE medical_record_field_configs IS 'Tenant-specific custom fields configuration';
COMMENT ON FUNCTION create_medical_record_on_appointment_completion IS 'Automatically creates a medical record when appointment is completed';
