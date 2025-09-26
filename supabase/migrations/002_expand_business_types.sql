-- Expand business types to include more specific medical and wellness categories
-- This migration adds more specific business types that will affect future configurations

-- First, add new values to the tenant_type enum
ALTER TYPE tenant_type ADD VALUE 'medical_clinic';
ALTER TYPE tenant_type ADD VALUE 'dental_clinic';
ALTER TYPE tenant_type ADD VALUE 'pediatric_clinic';
ALTER TYPE tenant_type ADD VALUE 'physiotherapy_clinic';
ALTER TYPE tenant_type ADD VALUE 'psychology_clinic';
ALTER TYPE tenant_type ADD VALUE 'aesthetic_clinic';
ALTER TYPE tenant_type ADD VALUE 'wellness_spa';
ALTER TYPE tenant_type ADD VALUE 'beauty_salon';
ALTER TYPE tenant_type ADD VALUE 'massage_center';
ALTER TYPE tenant_type ADD VALUE 'rehabilitation_center';
ALTER TYPE tenant_type ADD VALUE 'diagnostic_center';
ALTER TYPE tenant_type ADD VALUE 'veterinary_clinic';

-- Add business_settings column to tenants table to store type-specific configurations
ALTER TABLE tenants ADD COLUMN business_settings JSONB DEFAULT '{}';

-- Create index for business_settings JSONB column for better query performance
CREATE INDEX idx_tenants_business_settings ON tenants USING GIN (business_settings);

-- Add comments for documentation
COMMENT ON COLUMN tenants.business_settings IS 'Type-specific configuration settings stored as JSON';

-- Create a function to get default business settings based on tenant type
CREATE OR REPLACE FUNCTION get_default_business_settings(tenant_type tenant_type)
RETURNS JSONB AS $$
BEGIN
  RETURN CASE tenant_type
    WHEN 'medical_clinic' THEN '{
      "requires_insurance": true,
      "default_appointment_duration": 30,
      "requires_medical_history": true,
      "appointment_types": ["consultation", "follow_up", "emergency"],
      "color_theme": "medical_blue"
    }'::JSONB
    WHEN 'dental_clinic' THEN '{
      "requires_insurance": true,
      "default_appointment_duration": 60,
      "requires_medical_history": true,
      "appointment_types": ["cleaning", "checkup", "procedure", "emergency"],
      "color_theme": "dental_teal"
    }'::JSONB
    WHEN 'pediatric_clinic' THEN '{
      "requires_insurance": true,
      "default_appointment_duration": 45,
      "requires_medical_history": true,
      "requires_parent_consent": true,
      "appointment_types": ["checkup", "vaccination", "sick_visit"],
      "color_theme": "pediatric_green"
    }'::JSONB
    WHEN 'physiotherapy_clinic' THEN '{
      "requires_insurance": false,
      "default_appointment_duration": 60,
      "requires_medical_history": true,
      "appointment_types": ["assessment", "treatment", "maintenance"],
      "color_theme": "physio_orange"
    }'::JSONB
    WHEN 'psychology_clinic' THEN '{
      "requires_insurance": false,
      "default_appointment_duration": 60,
      "requires_medical_history": false,
      "appointment_types": ["therapy", "assessment", "group_session"],
      "color_theme": "psychology_purple"
    }'::JSONB
    WHEN 'aesthetic_clinic' THEN '{
      "requires_insurance": false,
      "default_appointment_duration": 90,
      "requires_medical_history": false,
      "appointment_types": ["consultation", "treatment", "maintenance"],
      "color_theme": "aesthetic_pink"
    }'::JSONB
    WHEN 'wellness_spa' THEN '{
      "requires_insurance": false,
      "default_appointment_duration": 90,
      "requires_medical_history": false,
      "appointment_types": ["massage", "facial", "body_treatment", "package"],
      "color_theme": "spa_zen"
    }'::JSONB
    WHEN 'beauty_salon' THEN '{
      "requires_insurance": false,
      "default_appointment_duration": 120,
      "requires_medical_history": false,
      "appointment_types": ["haircut", "coloring", "styling", "treatment"],
      "color_theme": "beauty_gold"
    }'::JSONB
    WHEN 'massage_center' THEN '{
      "requires_insurance": false,
      "default_appointment_duration": 60,
      "requires_medical_history": false,
      "appointment_types": ["relaxation", "therapeutic", "sports_massage"],
      "color_theme": "massage_earth"
    }'::JSONB
    WHEN 'rehabilitation_center' THEN '{
      "requires_insurance": true,
      "default_appointment_duration": 60,
      "requires_medical_history": true,
      "appointment_types": ["assessment", "therapy", "group_therapy"],
      "color_theme": "rehab_blue"
    }'::JSONB
    WHEN 'diagnostic_center' THEN '{
      "requires_insurance": true,
      "default_appointment_duration": 30,
      "requires_medical_history": true,
      "appointment_types": ["imaging", "lab_work", "screening"],
      "color_theme": "diagnostic_gray"
    }'::JSONB
    WHEN 'veterinary_clinic' THEN '{
      "requires_insurance": false,
      "default_appointment_duration": 30,
      "requires_medical_history": true,
      "appointment_types": ["checkup", "vaccination", "surgery", "emergency"],
      "color_theme": "vet_green"
    }'::JSONB
    -- Legacy types (maintain backwards compatibility)
    WHEN 'clinic' THEN '{
      "requires_insurance": true,
      "default_appointment_duration": 30,
      "requires_medical_history": true,
      "appointment_types": ["consultation", "follow_up"],
      "color_theme": "default_blue"
    }'::JSONB
    WHEN 'spa' THEN '{
      "requires_insurance": false,
      "default_appointment_duration": 90,
      "requires_medical_history": false,
      "appointment_types": ["massage", "facial", "treatment"],
      "color_theme": "spa_zen"
    }'::JSONB
    WHEN 'consultorio' THEN '{
      "requires_insurance": false,
      "default_appointment_duration": 45,
      "requires_medical_history": true,
      "appointment_types": ["consultation", "follow_up"],
      "color_theme": "consultorio_gray"
    }'::JSONB
    ELSE '{
      "requires_insurance": false,
      "default_appointment_duration": 60,
      "requires_medical_history": false,
      "appointment_types": ["appointment"],
      "color_theme": "default_blue"
    }'::JSONB
  END;
END;
$$ LANGUAGE plpgsql;

-- Update existing tenants to have default business settings based on their type
UPDATE tenants
SET business_settings = get_default_business_settings(tenant_type)
WHERE business_settings = '{}' OR business_settings IS NULL;

-- Create trigger to automatically set business settings for new tenants
CREATE OR REPLACE FUNCTION set_default_business_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.business_settings IS NULL OR NEW.business_settings = '{}' THEN
    NEW.business_settings = get_default_business_settings(NEW.tenant_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tenant_business_settings
  BEFORE INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION set_default_business_settings();