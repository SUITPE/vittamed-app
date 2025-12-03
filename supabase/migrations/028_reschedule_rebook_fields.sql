-- Migration: 028_reschedule_rebook_fields.sql
-- Ticket: VT-182 - DB: Campos de Reschedule/Rebook en appointments
-- Description: Add reschedule and rebook tracking fields to appointments table
-- Date: 2025-12-02

-- ============================================================================
-- ADD RESCHEDULE/REBOOK COLUMNS TO APPOINTMENTS
-- ============================================================================

-- original_appointment_id: Reference to the very first appointment in a chain
-- (useful for tracking the original booking when multiple reschedules occur)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'original_appointment_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN original_appointment_id uuid;
    RAISE NOTICE 'Column original_appointment_id added to appointments';
  ELSE
    RAISE NOTICE 'Column original_appointment_id already exists in appointments';
  END IF;
END $$;

-- rescheduled_from_id: Direct reference to the previous appointment (immediate parent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'rescheduled_from_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN rescheduled_from_id uuid;
    RAISE NOTICE 'Column rescheduled_from_id added to appointments';
  ELSE
    RAISE NOTICE 'Column rescheduled_from_id already exists in appointments';
  END IF;
END $$;

-- rescheduled_at: Timestamp when this appointment was created via reschedule
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'rescheduled_at'
  ) THEN
    ALTER TABLE appointments ADD COLUMN rescheduled_at timestamp with time zone;
    RAISE NOTICE 'Column rescheduled_at added to appointments';
  ELSE
    RAISE NOTICE 'Column rescheduled_at already exists in appointments';
  END IF;
END $$;

-- rescheduled_by: User ID who performed the reschedule
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'rescheduled_by'
  ) THEN
    ALTER TABLE appointments ADD COLUMN rescheduled_by uuid;
    RAISE NOTICE 'Column rescheduled_by added to appointments';
  ELSE
    RAISE NOTICE 'Column rescheduled_by already exists in appointments';
  END IF;
END $$;

-- reschedule_reason: Reason provided for the reschedule
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'reschedule_reason'
  ) THEN
    ALTER TABLE appointments ADD COLUMN reschedule_reason text;
    RAISE NOTICE 'Column reschedule_reason added to appointments';
  ELSE
    RAISE NOTICE 'Column reschedule_reason already exists in appointments';
  END IF;
END $$;

-- reschedule_count: Counter for how many times this appointment chain has been rescheduled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'reschedule_count'
  ) THEN
    ALTER TABLE appointments ADD COLUMN reschedule_count integer DEFAULT 0;
    RAISE NOTICE 'Column reschedule_count added to appointments';
  ELSE
    RAISE NOTICE 'Column reschedule_count already exists in appointments';
  END IF;
END $$;

-- is_rebook: Flag to indicate if this appointment is a rebook (same service, different date)
-- vs a true reschedule (same patient, potentially different service)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'is_rebook'
  ) THEN
    ALTER TABLE appointments ADD COLUMN is_rebook boolean DEFAULT false;
    RAISE NOTICE 'Column is_rebook added to appointments';
  ELSE
    RAISE NOTICE 'Column is_rebook already exists in appointments';
  END IF;
END $$;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- FK for original_appointment_id -> appointments(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_original_appointment_id_fkey'
  ) THEN
    ALTER TABLE appointments
    ADD CONSTRAINT appointments_original_appointment_id_fkey
    FOREIGN KEY (original_appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;
    RAISE NOTICE 'FK appointments_original_appointment_id_fkey added';
  ELSE
    RAISE NOTICE 'FK appointments_original_appointment_id_fkey already exists';
  END IF;
END $$;

-- FK for rescheduled_from_id -> appointments(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_rescheduled_from_id_fkey'
  ) THEN
    ALTER TABLE appointments
    ADD CONSTRAINT appointments_rescheduled_from_id_fkey
    FOREIGN KEY (rescheduled_from_id) REFERENCES appointments(id) ON DELETE SET NULL;
    RAISE NOTICE 'FK appointments_rescheduled_from_id_fkey added';
  ELSE
    RAISE NOTICE 'FK appointments_rescheduled_from_id_fkey already exists';
  END IF;
END $$;

-- FK for rescheduled_by -> custom_users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_rescheduled_by_fkey'
  ) THEN
    ALTER TABLE appointments
    ADD CONSTRAINT appointments_rescheduled_by_fkey
    FOREIGN KEY (rescheduled_by) REFERENCES custom_users(id) ON DELETE SET NULL;
    RAISE NOTICE 'FK appointments_rescheduled_by_fkey added';
  ELSE
    RAISE NOTICE 'FK appointments_rescheduled_by_fkey already exists';
  END IF;
END $$;

-- ============================================================================
-- ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for querying appointments by original appointment
CREATE INDEX IF NOT EXISTS idx_appointments_original_appointment
ON appointments(original_appointment_id) WHERE original_appointment_id IS NOT NULL;

-- Index for querying appointment reschedule chains
CREATE INDEX IF NOT EXISTS idx_appointments_rescheduled_from
ON appointments(rescheduled_from_id) WHERE rescheduled_from_id IS NOT NULL;

-- Index for finding rebooked appointments
CREATE INDEX IF NOT EXISTS idx_appointments_is_rebook
ON appointments(is_rebook) WHERE is_rebook = true;

-- Composite index for tenant + reschedule queries
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_reschedule
ON appointments(tenant_id, reschedule_count) WHERE reschedule_count > 0;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN appointments.original_appointment_id IS 'Reference to the very first appointment in a reschedule chain';
COMMENT ON COLUMN appointments.rescheduled_from_id IS 'Reference to the immediate previous appointment (direct parent in reschedule chain)';
COMMENT ON COLUMN appointments.rescheduled_at IS 'Timestamp when this appointment was created via reschedule';
COMMENT ON COLUMN appointments.rescheduled_by IS 'User ID who performed the reschedule action';
COMMENT ON COLUMN appointments.reschedule_reason IS 'Reason provided for rescheduling the appointment';
COMMENT ON COLUMN appointments.reschedule_count IS 'Number of times this appointment chain has been rescheduled (0 for original)';
COMMENT ON COLUMN appointments.is_rebook IS 'True if this is a rebook (rebooking after completion/no-show), false for true reschedule';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  col_count INTEGER;
  expected_cols TEXT[] := ARRAY['original_appointment_id', 'rescheduled_from_id', 'rescheduled_at', 'rescheduled_by', 'reschedule_reason', 'reschedule_count', 'is_rebook'];
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'appointments'
  AND column_name = ANY(expected_cols);

  IF col_count = array_length(expected_cols, 1) THEN
    RAISE NOTICE '✅ Migration 028 completed successfully. All 7 reschedule/rebook columns exist.';
  ELSE
    RAISE WARNING '⚠️ Migration 028 may have issues. Expected 7 columns, found %', col_count;
  END IF;
END $$;
