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
-- 5. ADD SUBSCRIPTION TO TENANTS TABLE
-- =====================================================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan_key text DEFAULT 'free' REFERENCES subscription_plans(plan_key);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_starts_at timestamp with time zone;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_ends_at timestamp with time zone;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'expired', 'cancelled', 'paused'));

-- =====================================================
-- 6. INSERT DEFAULT FEATURE FLAGS
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
-- 7. INSERT DEFAULT SUBSCRIPTION PLANS
-- =====================================================
INSERT INTO subscription_plans (plan_key, plan_name, description, price_monthly, price_yearly, max_users, max_appointments_per_month, is_active) VALUES
  ('free', 'Plan Gratuito', 'Funcionalidades básicas para empezar', 0, 0, 2, 100, true),
  ('basic', 'Plan Básico', 'Para profesionales independientes', 29, 290, 5, 500, true),
  ('professional', 'Plan Profesional', 'Para clínicas y consultorios', 79, 790, 15, 2000, true),
  ('enterprise', 'Plan Empresarial', 'Para organizaciones grandes', 199, 1990, NULL, NULL, true)
ON CONFLICT (plan_key) DO NOTHING;

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
-- 9. CREATE INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant_id ON tenant_features(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_feature_key ON tenant_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_tenant_features_enabled ON tenant_features(tenant_id, feature_key, is_enabled);
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_key ON plan_features(plan_key);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_plan ON tenants(subscription_plan_key);

-- =====================================================
-- 10. CREATE HELPER FUNCTION
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
-- 11. ENABLE DEFAULT FEATURES FOR EXISTING TENANTS
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
