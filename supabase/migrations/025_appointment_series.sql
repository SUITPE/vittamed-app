-- Migration: 025_appointment_series.sql
-- Ticket: VT-91 - DB: Migración appointment_series
-- Description: Create appointment_series table for recurring appointments
-- Date: 2025-12-02

-- ============================================================================
-- ENUM: recurrence_type
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_type') THEN
    CREATE TYPE recurrence_type AS ENUM (
      'daily',
      'weekly',
      'biweekly',
      'monthly',
      'custom'
    );
    RAISE NOTICE 'Created recurrence_type enum';
  ELSE
    RAISE NOTICE 'recurrence_type enum already exists';
  END IF;
END $$;

-- ============================================================================
-- ENUM: series_status
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'series_status') THEN
    CREATE TYPE series_status AS ENUM (
      'active',
      'paused',
      'completed',
      'cancelled'
    );
    RAISE NOTICE 'Created series_status enum';
  ELSE
    RAISE NOTICE 'series_status enum already exists';
  END IF;
END $$;

-- ============================================================================
-- TABLE: appointment_series
-- Stores configuration for recurring appointment series
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_series (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Tenant and participants
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  member_id uuid REFERENCES custom_users(id) ON DELETE SET NULL,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,

  -- Recurrence configuration
  recurrence_type recurrence_type NOT NULL DEFAULT 'weekly',
  recurrence_interval integer NOT NULL DEFAULT 1 CHECK (recurrence_interval >= 1 AND recurrence_interval <= 12),
  recurrence_days integer[] DEFAULT '{}', -- 0=Sun, 1=Mon, ..., 6=Sat (for weekly/custom)

  -- Schedule
  base_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30 CHECK (duration_minutes >= 5 AND duration_minutes <= 480),

  -- Date range
  start_date date NOT NULL,
  end_date date,
  max_occurrences integer CHECK (max_occurrences IS NULL OR (max_occurrences >= 1 AND max_occurrences <= 100)),

  -- Status
  status series_status NOT NULL DEFAULT 'active',

  -- Metadata
  notes text,
  created_by uuid REFERENCES custom_users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT appointment_series_provider_check CHECK (
    doctor_id IS NOT NULL OR member_id IS NOT NULL
  ),
  CONSTRAINT appointment_series_end_check CHECK (
    end_date IS NULL OR end_date >= start_date
  ),
  CONSTRAINT appointment_series_limit_check CHECK (
    end_date IS NOT NULL OR max_occurrences IS NOT NULL
  )
);

-- Comments
COMMENT ON TABLE appointment_series IS 'Configuration for recurring appointment series (VT-91)';
COMMENT ON COLUMN appointment_series.recurrence_type IS 'daily, weekly, biweekly, monthly, or custom';
COMMENT ON COLUMN appointment_series.recurrence_interval IS 'Every N days/weeks/months (1-12)';
COMMENT ON COLUMN appointment_series.recurrence_days IS 'Days of week for weekly/custom: 0=Sun, 1=Mon, ..., 6=Sat';
COMMENT ON COLUMN appointment_series.base_time IS 'Start time for appointments in the series';
COMMENT ON COLUMN appointment_series.max_occurrences IS 'Maximum number of appointments (1-100)';

-- ============================================================================
-- MODIFY APPOINTMENTS TABLE: Add series columns
-- ============================================================================

-- Add series_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'series_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN series_id uuid;
    RAISE NOTICE 'Column series_id added to appointments';
  ELSE
    RAISE NOTICE 'Column series_id already exists in appointments';
  END IF;
END $$;

-- Add series_occurrence column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'series_occurrence'
  ) THEN
    ALTER TABLE appointments ADD COLUMN series_occurrence integer;
    RAISE NOTICE 'Column series_occurrence added to appointments';
  ELSE
    RAISE NOTICE 'Column series_occurrence already exists in appointments';
  END IF;
END $$;

-- FK for series_id -> appointment_series(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_series_id_fkey'
  ) THEN
    ALTER TABLE appointments
    ADD CONSTRAINT appointments_series_id_fkey
    FOREIGN KEY (series_id) REFERENCES appointment_series(id) ON DELETE SET NULL;
    RAISE NOTICE 'FK appointments_series_id_fkey added';
  ELSE
    RAISE NOTICE 'FK appointments_series_id_fkey already exists';
  END IF;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- appointment_series indexes
CREATE INDEX IF NOT EXISTS idx_appointment_series_tenant ON appointment_series(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_series_patient ON appointment_series(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointment_series_doctor ON appointment_series(doctor_id) WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointment_series_member ON appointment_series(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointment_series_service ON appointment_series(service_id);
CREATE INDEX IF NOT EXISTS idx_appointment_series_status ON appointment_series(status);
CREATE INDEX IF NOT EXISTS idx_appointment_series_tenant_status ON appointment_series(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_appointment_series_dates ON appointment_series(start_date, end_date);

-- appointments table indexes for series
CREATE INDEX IF NOT EXISTS idx_appointments_series ON appointments(series_id) WHERE series_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_series_occurrence ON appointments(series_id, series_occurrence) WHERE series_id IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE appointment_series ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can see series from their tenant
DROP POLICY IF EXISTS "appointment_series_select_policy" ON appointment_series;
CREATE POLICY "appointment_series_select_policy" ON appointment_series
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users WHERE id = auth.uid()
    )
    OR
    -- Patients can see their own series
    patient_id IN (
      SELECT id FROM patients WHERE email = (
        SELECT email FROM custom_users WHERE id = auth.uid()
      )
    )
  );

-- INSERT policy: Admins and staff can create series
DROP POLICY IF EXISTS "appointment_series_insert_policy" ON appointment_series;
CREATE POLICY "appointment_series_insert_policy" ON appointment_series
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff', 'doctor', 'super_admin')
    )
  );

-- UPDATE policy: Admins, staff, and assigned providers can update
DROP POLICY IF EXISTS "appointment_series_update_policy" ON appointment_series;
CREATE POLICY "appointment_series_update_policy" ON appointment_series
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff', 'super_admin')
    )
    OR
    -- Doctors can update their own series
    (doctor_id IS NOT NULL AND doctor_id IN (
      SELECT id FROM doctors WHERE user_id = auth.uid()
    ))
    OR
    -- Members can update their own series
    member_id = auth.uid()
  );

-- DELETE policy: Only admins can delete series
DROP POLICY IF EXISTS "appointment_series_delete_policy" ON appointment_series;
CREATE POLICY "appointment_series_delete_policy" ON appointment_series
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'super_admin')
    )
  );

-- ============================================================================
-- TRIGGER: updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS update_appointment_series_updated_at ON appointment_series;
CREATE TRIGGER update_appointment_series_updated_at
  BEFORE UPDATE ON appointment_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  col_count INTEGER;
BEGIN
  -- Check appointment_series exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'appointment_series'
  ) INTO table_exists;

  -- Check appointments columns
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'appointments'
  AND column_name IN ('series_id', 'series_occurrence');

  IF table_exists AND col_count = 2 THEN
    RAISE NOTICE '✅ Migration 025 completed successfully. appointment_series table created and appointments updated.';
  ELSE
    RAISE WARNING '⚠️ Migration 025 may have issues. table_exists=%, col_count=%', table_exists, col_count;
  END IF;
END $$;
