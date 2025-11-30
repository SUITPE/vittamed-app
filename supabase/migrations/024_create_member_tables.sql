-- Migration: 024_create_member_tables.sql
-- Ticket: VT-261 - Tablas member_* no existen
-- Description: Create member_services, member_availability, and member_breaks tables
-- Date: 2025-11-29

-- ============================================================================
-- TABLE 1: member_services
-- Associates members with the services they can provide
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_services (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_user_id uuid NOT NULL REFERENCES custom_users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT member_services_unique UNIQUE(member_user_id, service_id, tenant_id)
);

-- Indexes for member_services
CREATE INDEX IF NOT EXISTS idx_member_services_member_user_id ON member_services(member_user_id);
CREATE INDEX IF NOT EXISTS idx_member_services_service_id ON member_services(service_id);
CREATE INDEX IF NOT EXISTS idx_member_services_tenant_id ON member_services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_member_services_tenant_active ON member_services(tenant_id, is_active) WHERE is_active = true;

-- Comments
COMMENT ON TABLE member_services IS 'Association between members and the services they can provide';
COMMENT ON COLUMN member_services.member_user_id IS 'Reference to custom_users with role=member';
COMMENT ON COLUMN member_services.service_id IS 'Reference to services table';
COMMENT ON COLUMN member_services.is_active IS 'Whether this member can currently provide this service';

-- ============================================================================
-- TABLE 2: member_availability
-- Defines weekly availability schedule for members
-- ============================================================================

CREATE TABLE IF NOT EXISTS member_availability (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_user_id uuid NOT NULL REFERENCES custom_users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT member_availability_time_check CHECK (start_time < end_time),
  CONSTRAINT member_availability_unique UNIQUE(member_user_id, tenant_id, day_of_week, start_time)
);

-- Indexes for member_availability
CREATE INDEX IF NOT EXISTS idx_member_availability_member_user_id ON member_availability(member_user_id);
CREATE INDEX IF NOT EXISTS idx_member_availability_tenant_id ON member_availability(tenant_id);
CREATE INDEX IF NOT EXISTS idx_member_availability_day ON member_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_member_availability_member_day ON member_availability(member_user_id, day_of_week) WHERE is_active = true;

-- Comments
COMMENT ON TABLE member_availability IS 'Weekly availability schedule for members';
COMMENT ON COLUMN member_availability.day_of_week IS '0 = Sunday, 1 = Monday, ..., 6 = Saturday';
COMMENT ON COLUMN member_availability.start_time IS 'Start time of availability period';
COMMENT ON COLUMN member_availability.end_time IS 'End time of availability period';

-- ============================================================================
-- TABLE 3: member_breaks
-- Defines break periods for members (lunch, rest, etc.)
-- ============================================================================

-- Create break_type enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'break_type') THEN
    CREATE TYPE break_type AS ENUM ('lunch', 'break', 'other');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS member_breaks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_user_id uuid NOT NULL REFERENCES custom_users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_type break_type DEFAULT 'break',
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  CONSTRAINT member_breaks_time_check CHECK (start_time < end_time)
);

-- Indexes for member_breaks
CREATE INDEX IF NOT EXISTS idx_member_breaks_member_user_id ON member_breaks(member_user_id);
CREATE INDEX IF NOT EXISTS idx_member_breaks_tenant_id ON member_breaks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_member_breaks_day ON member_breaks(day_of_week);
CREATE INDEX IF NOT EXISTS idx_member_breaks_member_day ON member_breaks(member_user_id, day_of_week) WHERE is_active = true;

-- Comments
COMMENT ON TABLE member_breaks IS 'Break periods for members (lunch, rest breaks, etc.)';
COMMENT ON COLUMN member_breaks.day_of_week IS '0 = Sunday, 1 = Monday, ..., 6 = Saturday';
COMMENT ON COLUMN member_breaks.break_type IS 'Type of break: lunch, break, or other';
COMMENT ON COLUMN member_breaks.description IS 'Optional description of the break';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE member_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_breaks ENABLE ROW LEVEL SECURITY;

-- member_services policies
DROP POLICY IF EXISTS "member_services_select_policy" ON member_services;
CREATE POLICY "member_services_select_policy" ON member_services
  FOR SELECT USING (
    -- Public can see active services (for booking)
    is_active = true
    OR
    -- Authenticated users in same tenant can see all
    tenant_id IN (
      SELECT tenant_id FROM custom_users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "member_services_insert_policy" ON member_services;
CREATE POLICY "member_services_insert_policy" ON member_services
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "member_services_update_policy" ON member_services;
CREATE POLICY "member_services_update_policy" ON member_services
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "member_services_delete_policy" ON member_services;
CREATE POLICY "member_services_delete_policy" ON member_services
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'super_admin')
    )
  );

-- member_availability policies
DROP POLICY IF EXISTS "member_availability_select_policy" ON member_availability;
CREATE POLICY "member_availability_select_policy" ON member_availability
  FOR SELECT USING (
    -- Public can see active availability (for booking)
    is_active = true
    OR
    -- Members can see their own
    member_user_id = auth.uid()
    OR
    -- Same tenant users can see all
    tenant_id IN (
      SELECT tenant_id FROM custom_users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "member_availability_insert_policy" ON member_availability;
CREATE POLICY "member_availability_insert_policy" ON member_availability
  FOR INSERT WITH CHECK (
    -- Members can create their own
    member_user_id = auth.uid()
    OR
    -- Admins can create for any member in tenant
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "member_availability_update_policy" ON member_availability;
CREATE POLICY "member_availability_update_policy" ON member_availability
  FOR UPDATE USING (
    member_user_id = auth.uid()
    OR
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "member_availability_delete_policy" ON member_availability;
CREATE POLICY "member_availability_delete_policy" ON member_availability
  FOR DELETE USING (
    member_user_id = auth.uid()
    OR
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'super_admin')
    )
  );

-- member_breaks policies (same as availability)
DROP POLICY IF EXISTS "member_breaks_select_policy" ON member_breaks;
CREATE POLICY "member_breaks_select_policy" ON member_breaks
  FOR SELECT USING (
    is_active = true
    OR member_user_id = auth.uid()
    OR tenant_id IN (
      SELECT tenant_id FROM custom_users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "member_breaks_insert_policy" ON member_breaks;
CREATE POLICY "member_breaks_insert_policy" ON member_breaks
  FOR INSERT WITH CHECK (
    member_user_id = auth.uid()
    OR tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "member_breaks_update_policy" ON member_breaks;
CREATE POLICY "member_breaks_update_policy" ON member_breaks
  FOR UPDATE USING (
    member_user_id = auth.uid()
    OR tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "member_breaks_delete_policy" ON member_breaks;
CREATE POLICY "member_breaks_delete_policy" ON member_breaks
  FOR DELETE USING (
    member_user_id = auth.uid()
    OR tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'super_admin')
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Trigger function (create if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_member_services_updated_at ON member_services;
CREATE TRIGGER update_member_services_updated_at
  BEFORE UPDATE ON member_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_member_availability_updated_at ON member_availability;
CREATE TRIGGER update_member_availability_updated_at
  BEFORE UPDATE ON member_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_member_breaks_updated_at ON member_breaks;
CREATE TRIGGER update_member_breaks_updated_at
  BEFORE UPDATE ON member_breaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('member_services', 'member_availability', 'member_breaks');

  IF table_count = 3 THEN
    RAISE NOTICE '✅ Migration 024 completed successfully. All 3 member tables exist.';
  ELSE
    RAISE WARNING '⚠️ Migration 024 may have issues. Expected 3 tables, found %', table_count;
  END IF;
END $$;
