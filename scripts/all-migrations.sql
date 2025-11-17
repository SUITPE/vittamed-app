-- Migration: Tenant Feature Flags System
-- Description: Add feature flags for tenants to enable/disable functionality based on subscription

-- =====================================================
-- 1. CREATE FEATURE FLAGS TABLE
-- =====================================================
-- This table defines all available features in the system
CREATE TABLE IF NOT EXISTS feature_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key text NOT NULL UNIQUE, -- e.g., 'patient_management', 'electronic_prescriptions'
  feature_name text NOT NULL, -- Display name
  description text,
  category text NOT NULL, -- 'clinical', 'business', 'marketing', etc.
  is_premium boolean DEFAULT false, -- Requires paid subscription
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 2. CREATE TENANT FEATURES TABLE
-- =====================================================
-- This table tracks which features are enabled for each tenant
CREATE TABLE IF NOT EXISTS tenant_features (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES feature_flags(feature_key) ON DELETE CASCADE,
  is_enabled boolean DEFAULT false,
  enabled_at timestamp with time zone,
  disabled_at timestamp with time zone,
  notes text, -- Optional notes about why feature was enabled/disabled
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(tenant_id, feature_key)
);

-- =====================================================
-- 3. CREATE SUBSCRIPTION PLANS TABLE (for future use)
-- =====================================================
-- This will be used later to manage subscription tiers
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_key text NOT NULL UNIQUE, -- 'free', 'basic', 'professional', 'enterprise'
  plan_name text NOT NULL,
  description text,
  price_monthly numeric(10, 2) DEFAULT 0,
  price_yearly numeric(10, 2) DEFAULT 0,
  max_users integer,
  max_appointments_per_month integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- 4. CREATE PLAN FEATURES TABLE (for future use)
-- =====================================================
-- This maps which features are included in each plan
CREATE TABLE IF NOT EXISTS plan_features (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_key text NOT NULL REFERENCES subscription_plans(plan_key) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES feature_flags(feature_key) ON DELETE CASCADE,
  is_included boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(plan_key, feature_key)
);

-- =====================================================
-- 5. INSERT DEFAULT FEATURE FLAGS (BEFORE ADDING CONSTRAINTS)
-- =====================================================
INSERT INTO feature_flags (feature_key, feature_name, description, category, is_premium) VALUES
  -- Clinical Features
  ('patient_management', 'Gestión de Pacientes', 'Historia clínica, recetas médicas, y gestión completa de pacientes', 'clinical', true),
  ('electronic_prescriptions', 'Recetas Electrónicas', 'Generación de recetas médicas electrónicas', 'clinical', true),
  ('medical_records', 'Historias Clínicas', 'Sistema completo de historias clínicas digitales', 'clinical', true),
  ('lab_results', 'Resultados de Laboratorio', 'Gestión y visualización de resultados de laboratorio', 'clinical', true),
  ('imaging_storage', 'Almacenamiento de Imágenes', 'Almacenamiento de radiografías y estudios de imagen', 'clinical', true),

  -- Business Features
  ('appointments', 'Gestión de Citas', 'Sistema de agendamiento de citas', 'business', false),
  ('inventory_management', 'Gestión de Inventario', 'Control de productos y materiales', 'business', true),
  ('billing', 'Facturación', 'Sistema de facturación y pagos', 'business', true),
  ('reports', 'Reportes y Estadísticas', 'Reportes detallados de negocio', 'business', true),
  ('multi_location', 'Multi-sucursal', 'Gestión de múltiples sucursales', 'business', true),

  -- Marketing Features
  ('email_marketing', 'Email Marketing', 'Campañas de email automatizadas', 'marketing', true),
  ('whatsapp_notifications', 'Notificaciones WhatsApp', 'Recordatorios automáticos por WhatsApp', 'marketing', true),
  ('online_booking', 'Reservas Online', 'Widget de reservas para sitio web', 'marketing', false),
  ('loyalty_program', 'Programa de Fidelización', 'Sistema de puntos y recompensas', 'marketing', true),

  -- Integration Features
  ('api_access', 'Acceso API', 'Acceso a API para integraciones', 'integration', true),
  ('calendar_sync', 'Sincronización de Calendario', 'Sincronización con Google Calendar y Outlook', 'integration', true),
  ('stripe_integration', 'Integración Stripe', 'Procesamiento de pagos con Stripe', 'integration', true)
ON CONFLICT (feature_key) DO NOTHING;

-- =====================================================
-- 6. INSERT DEFAULT SUBSCRIPTION PLANS (BEFORE FOREIGN KEY)
-- =====================================================
INSERT INTO subscription_plans (plan_key, plan_name, description, price_monthly, price_yearly, max_users, max_appointments_per_month, is_active) VALUES
  ('free', 'Plan Gratuito', 'Funcionalidades básicas para empezar', 0, 0, 2, 100, true),
  ('basic', 'Plan Básico', 'Para profesionales independientes', 29, 290, 5, 500, true),
  ('professional', 'Plan Profesional', 'Para clínicas y consultorios', 79, 790, 15, 2000, true),
  ('enterprise', 'Plan Empresarial', 'Para organizaciones grandes', 199, 1990, NULL, NULL, true)
ON CONFLICT (plan_key) DO NOTHING;

-- =====================================================
-- 7. ADD SUBSCRIPTION COLUMNS TO TENANTS TABLE (AFTER PLANS ARE INSERTED)
-- =====================================================
-- First add columns without foreign key constraint
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan_key text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_starts_at timestamp with time zone;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_ends_at timestamp with time zone;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active';

-- Set default values for existing tenants
UPDATE tenants SET subscription_plan_key = 'free' WHERE subscription_plan_key IS NULL;
UPDATE tenants SET subscription_status = 'active' WHERE subscription_status IS NULL;

-- Now add the foreign key constraint
ALTER TABLE tenants
  ADD CONSTRAINT tenants_subscription_plan_key_fkey
  FOREIGN KEY (subscription_plan_key)
  REFERENCES subscription_plans(plan_key);

-- Add check constraint for subscription_status
ALTER TABLE tenants
  ADD CONSTRAINT tenants_subscription_status_check
  CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled', 'paused'));

-- =====================================================
-- 8. MAP FEATURES TO PLANS
-- =====================================================
-- Free Plan (minimal features)
INSERT INTO plan_features (plan_key, feature_key, is_included) VALUES
  ('free', 'appointments', true),
  ('free', 'online_booking', true)
ON CONFLICT (plan_key, feature_key) DO NOTHING;

-- Basic Plan
INSERT INTO plan_features (plan_key, feature_key, is_included) VALUES
  ('basic', 'appointments', true),
  ('basic', 'online_booking', true),
  ('basic', 'patient_management', true),
  ('basic', 'electronic_prescriptions', true),
  ('basic', 'medical_records', true),
  ('basic', 'billing', true),
  ('basic', 'whatsapp_notifications', true)
ON CONFLICT (plan_key, feature_key) DO NOTHING;

-- Professional Plan
INSERT INTO plan_features (plan_key, feature_key, is_included) VALUES
  ('professional', 'appointments', true),
  ('professional', 'online_booking', true),
  ('professional', 'patient_management', true),
  ('professional', 'electronic_prescriptions', true),
  ('professional', 'medical_records', true),
  ('professional', 'lab_results', true),
  ('professional', 'imaging_storage', true),
  ('professional', 'inventory_management', true),
  ('professional', 'billing', true),
  ('professional', 'reports', true),
  ('professional', 'email_marketing', true),
  ('professional', 'whatsapp_notifications', true),
  ('professional', 'calendar_sync', true),
  ('professional', 'stripe_integration', true)
ON CONFLICT (plan_key, feature_key) DO NOTHING;

-- Enterprise Plan (all features)
INSERT INTO plan_features (plan_key, feature_key, is_included)
SELECT 'enterprise', feature_key, true
FROM feature_flags
ON CONFLICT (plan_key, feature_key) DO NOTHING;

-- =====================================================
-- 9. ENABLE DEFAULT FEATURES FOR EXISTING TENANTS
-- =====================================================
-- Enable basic features for all existing tenants (free plan defaults)
INSERT INTO tenant_features (tenant_id, feature_key, is_enabled, enabled_at)
SELECT t.id, 'appointments', true, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_features tf
  WHERE tf.tenant_id = t.id AND tf.feature_key = 'appointments'
);

INSERT INTO tenant_features (tenant_id, feature_key, is_enabled, enabled_at)
SELECT t.id, 'online_booking', true, NOW()
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM tenant_features tf
  WHERE tf.tenant_id = t.id AND tf.feature_key = 'online_booking'
);

-- =====================================================
-- 10. CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id ON tenant_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_feature_key ON tenant_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_tenant_features_enabled ON tenant_features(tenant_id, feature_key, is_enabled);
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_key ON plan_features(plan_key);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_plan ON tenants(subscription_plan_key);

-- =====================================================
-- 11. CREATE HELPER FUNCTIONS
-- =====================================================
-- Function to check if a tenant has a specific feature enabled
CREATE OR REPLACE FUNCTION tenant_has_feature(
  p_tenant_id uuid,
  p_feature_key text
) RETURNS boolean AS $$
DECLARE
  feature_enabled boolean;
BEGIN
  -- Check if feature is explicitly enabled for tenant
  SELECT is_enabled INTO feature_enabled
  FROM tenant_features
  WHERE tenant_id = p_tenant_id AND feature_key = p_feature_key;

  -- If no explicit setting, check if it's included in their plan
  IF feature_enabled IS NULL THEN
    SELECT pf.is_included INTO feature_enabled
    FROM tenants t
    JOIN plan_features pf ON pf.plan_key = t.subscription_plan_key
    WHERE t.id = p_tenant_id AND pf.feature_key = p_feature_key;
  END IF;

  -- Default to false if not found anywhere
  RETURN COALESCE(feature_enabled, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable/disable a feature for a tenant
CREATE OR REPLACE FUNCTION set_tenant_feature(
  p_tenant_id uuid,
  p_feature_key text,
  p_is_enabled boolean,
  p_notes text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO tenant_features (tenant_id, feature_key, is_enabled, enabled_at, disabled_at, notes)
  VALUES (
    p_tenant_id,
    p_feature_key,
    p_is_enabled,
    CASE WHEN p_is_enabled THEN NOW() ELSE NULL END,
    CASE WHEN NOT p_is_enabled THEN NOW() ELSE NULL END,
    p_notes
  )
  ON CONFLICT (tenant_id, feature_key) DO UPDATE SET
    is_enabled = p_is_enabled,
    enabled_at = CASE WHEN p_is_enabled AND tenant_features.is_enabled = false THEN NOW() ELSE tenant_features.enabled_at END,
    disabled_at = CASE WHEN NOT p_is_enabled AND tenant_features.is_enabled = true THEN NOW() ELSE tenant_features.disabled_at END,
    notes = COALESCE(p_notes, tenant_features.notes),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. CREATE RLS POLICIES
-- =====================================================
-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- Feature flags are readable by everyone (they're just definitions)
CREATE POLICY "Feature flags are viewable by authenticated users" ON feature_flags
  FOR SELECT
  USING (true);

-- Tenant features can only be viewed by users in that tenant or admins
CREATE POLICY "Tenant features viewable by tenant members" ON tenant_features
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Only super admins can modify tenant features
CREATE POLICY "Only admins can modify tenant features" ON tenant_features
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Subscription plans are viewable by everyone
CREATE POLICY "Subscription plans viewable by authenticated users" ON subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Plan features are viewable by everyone
CREATE POLICY "Plan features viewable by authenticated users" ON plan_features
  FOR SELECT
  USING (true);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE feature_flags IS 'Defines all available features in the system';
COMMENT ON TABLE tenant_features IS 'Tracks which features are enabled for each tenant';
COMMENT ON TABLE subscription_plans IS 'Available subscription plans and their pricing';
COMMENT ON TABLE plan_features IS 'Maps features to subscription plans';
COMMENT ON FUNCTION tenant_has_feature IS 'Check if a tenant has access to a specific feature';
COMMENT ON FUNCTION set_tenant_feature IS 'Enable or disable a feature for a specific tenant';
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
-- Migration: webhook_logs table for Culqi webhook auditing (TASK-BE-004)
-- Purpose: Log all webhook attempts for security and debugging
-- Author: Backend Dev 1
-- Date: 2025-11-07

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider info
  provider text NOT NULL, -- 'culqi', 'stripe', etc.

  -- Event info
  event_type text NOT NULL, -- 'charge.succeeded', 'charge.failed', etc.
  status text NOT NULL, -- 'received', 'processed', 'signature_failed', 'error'

  -- Payload and signature
  payload jsonb NOT NULL,
  signature_header text,

  -- Error tracking
  processing_error text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider ON webhook_logs(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Index for idempotency check (TASK-BE-005)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id
ON webhook_logs(provider, (payload->>'id'), status)
WHERE status = 'processed';

-- Add comment
COMMENT ON TABLE webhook_logs IS 'Logs all webhook attempts for auditing and debugging (TASK-BE-004)';
COMMENT ON COLUMN webhook_logs.status IS 'received | processed | signature_failed | signature_missing | error';
COMMENT ON COLUMN webhook_logs.processing_error IS 'Error message if processing failed';
-- Migration: payment_transactions table (TASK-BE-005)
-- Purpose: Track all payment transactions and subscription events
-- Author: Backend Dev 1
-- Date: 2025-11-07

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant reference
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Provider info
  provider text NOT NULL, -- 'culqi', 'stripe'
  provider_charge_id text NOT NULL UNIQUE,

  -- Transaction details
  amount numeric(10, 2) NOT NULL, -- Negative for refunds
  currency text NOT NULL DEFAULT 'PEN',
  status text NOT NULL, -- 'succeeded', 'failed', 'refunded', 'pending'

  -- Plan info
  plan_key text, -- 'free', 'care', 'pro', 'enterprise'
  billing_cycle text, -- 'monthly', 'annual'

  -- Error handling
  error_message text,

  -- Metadata from payment provider
  metadata jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_charge ON payment_transactions(provider_charge_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE payment_transactions IS 'Payment transactions for subscription management (TASK-BE-005)';
COMMENT ON COLUMN payment_transactions.amount IS 'Amount in currency (negative for refunds)';
COMMENT ON COLUMN payment_transactions.status IS 'succeeded | failed | refunded | pending';
COMMENT ON COLUMN payment_transactions.plan_key IS 'free | care | pro | enterprise';
-- Migration: Add subscription fields to tenants table (TASK-BE-005)
-- Purpose: Track subscription status and payment info for each tenant
-- Author: Backend Dev 1
-- Date: 2025-11-07

-- Add new subscription fields to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS subscription_plan_key text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_starts_at timestamptz,
ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz,
ADD COLUMN IF NOT EXISTS billing_cycle text, -- 'monthly', 'annual'
ADD COLUMN IF NOT EXISTS last_payment_date timestamptz,
ADD COLUMN IF NOT EXISTS last_payment_amount numeric(10, 2),
ADD COLUMN IF NOT EXISTS last_payment_error text,
ADD COLUMN IF NOT EXISTS last_payment_attempt timestamptz,
ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Create index for subscription status queries
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_plan ON tenants(subscription_plan_key);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_ends ON tenants(subscription_ends_at);

-- Add comments
COMMENT ON COLUMN tenants.subscription_plan_key IS 'free | care | pro | enterprise';
COMMENT ON COLUMN tenants.subscription_status IS 'active | expired | cancelled | payment_failed';
COMMENT ON COLUMN tenants.billing_cycle IS 'monthly | annual';
COMMENT ON COLUMN tenants.last_payment_amount IS 'Amount in currency (PEN)';

-- Update existing tenants to have default subscription (free plan)
UPDATE tenants
SET subscription_plan_key = 'free',
    subscription_status = 'active'
WHERE subscription_plan_key IS NULL;
-- Migration: 020_icd10_codes.sql
-- Description: Base de datos CIE-10 completa con búsqueda semántica para historias clínicas inteligentes
-- TASK: TASK-BE-041
-- Epic: EPIC-004 (Historias Clínicas Inteligentes)

-- Habilitar extensión para búsqueda de similitud (trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Tabla principal de códigos CIE-10
CREATE TABLE IF NOT EXISTS icd10_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Código CIE-10 (ej: "I10", "E11.9")
  code text NOT NULL UNIQUE,

  -- Descripción completa (ej: "Hipertensión esencial (primaria)")
  description text NOT NULL,

  -- Categoría/Capítulo (ej: "I00-I99 Enfermedades del sistema circulatorio")
  category text NOT NULL,
  chapter_code text, -- "I00-I99"
  chapter_name text, -- "Enfermedades del sistema circulatorio"

  -- Jerarquía (algunos códigos son subcategorías de otros)
  parent_code text REFERENCES icd10_codes(code) ON DELETE SET NULL,

  -- Sinónimos y términos de búsqueda (array de strings)
  search_terms text[] DEFAULT '{}',

  -- Metadata
  is_billable boolean DEFAULT true, -- Si es válido para facturación
  includes_note text, -- Notas de inclusión
  excludes_note text, -- Notas de exclusión

  -- Frecuencia de uso (para ordenar resultados populares primero)
  usage_count integer DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para búsqueda rápida

-- Índice para búsqueda por código exacto
CREATE INDEX IF NOT EXISTS idx_icd10_code ON icd10_codes(code);

-- Índice GIN con trigram para búsqueda difusa de descripción
CREATE INDEX IF NOT EXISTS idx_icd10_description_trgm ON icd10_codes USING gin(description gin_trgm_ops);

-- Índice GIN para búsqueda en array de sinónimos
CREATE INDEX IF NOT EXISTS idx_icd10_search_terms ON icd10_codes USING gin(search_terms);

-- Índice para filtrado por categoría
CREATE INDEX IF NOT EXISTS idx_icd10_category ON icd10_codes(category);

-- Índice para filtrado por capítulo
CREATE INDEX IF NOT EXISTS idx_icd10_chapter_code ON icd10_codes(chapter_code);

-- Índice para ordenar por frecuencia de uso
CREATE INDEX IF NOT EXISTS idx_icd10_usage_count ON icd10_codes(usage_count DESC);

-- Columna para búsqueda full-text en español
ALTER TABLE icd10_codes ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Índice GIN para búsqueda full-text
CREATE INDEX IF NOT EXISTS idx_icd10_search_vector ON icd10_codes USING gin(search_vector);

-- Trigger para actualizar search_vector automáticamente
CREATE OR REPLACE FUNCTION icd10_search_vector_update() RETURNS trigger AS $$
BEGIN
  -- Peso A: código (más importante)
  -- Peso B: descripción (importante)
  -- Peso C: sinónimos (menos importante)
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.code, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(array_to_string(NEW.search_terms, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trgm_icd10_search_vector ON icd10_codes;
CREATE TRIGGER trgm_icd10_search_vector
BEFORE INSERT OR UPDATE ON icd10_codes
FOR EACH ROW
EXECUTE FUNCTION icd10_search_vector_update();

-- RLS Policies: lectura pública para usuarios autenticados, escritura solo para superadmins

ALTER TABLE icd10_codes ENABLE ROW LEVEL SECURITY;

-- Policy: lectura para todos los usuarios autenticados
DROP POLICY IF EXISTS "ICD10 codes are readable by all authenticated users" ON icd10_codes;
CREATE POLICY "ICD10 codes are readable by all authenticated users"
ON icd10_codes FOR SELECT
TO authenticated
USING (true);

-- Policy: escritura solo para service_role (scripts de seed)
-- No crear policy restrictiva para INSERT/UPDATE/DELETE ya que usaremos service_role_key para seeds

-- Función para incrementar el contador de uso (llamar desde API cuando se selecciona un código)
CREATE OR REPLACE FUNCTION increment_icd10_usage(code_param text)
RETURNS void AS $$
BEGIN
  UPDATE icd10_codes
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE code = code_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios en tabla para documentación
COMMENT ON TABLE icd10_codes IS 'Códigos CIE-10 (Clasificación Internacional de Enfermedades, 10ª revisión) en español para historias clínicas inteligentes';
COMMENT ON COLUMN icd10_codes.code IS 'Código CIE-10 único (ej: I10, E11.9)';
COMMENT ON COLUMN icd10_codes.description IS 'Descripción completa del diagnóstico en español';
COMMENT ON COLUMN icd10_codes.category IS 'Categoría dentro del capítulo CIE-10';
COMMENT ON COLUMN icd10_codes.chapter_code IS 'Código del capítulo CIE-10 (ej: I00-I99)';
COMMENT ON COLUMN icd10_codes.chapter_name IS 'Nombre del capítulo CIE-10';
COMMENT ON COLUMN icd10_codes.parent_code IS 'Código padre para jerarquía (códigos generales vs específicos)';
COMMENT ON COLUMN icd10_codes.search_terms IS 'Array de sinónimos y términos alternativos para búsqueda';
COMMENT ON COLUMN icd10_codes.is_billable IS 'Si es válido para facturación a aseguradoras';
COMMENT ON COLUMN icd10_codes.usage_count IS 'Contador de uso para ordenar resultados por popularidad';
COMMENT ON COLUMN icd10_codes.search_vector IS 'Vector de búsqueda full-text (generado automáticamente)';
