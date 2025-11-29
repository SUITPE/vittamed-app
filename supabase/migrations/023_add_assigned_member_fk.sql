-- Migration: 023_add_assigned_member_fk.sql
-- Ticket: VT-264 - FK assigned_member_id no existe
-- Description: Add assigned_member_id column and FK constraint to appointments
-- Date: 2025-11-29

-- ============================================================================
-- ADD assigned_member_id COLUMN (if not exists)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'assigned_member_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN assigned_member_id uuid;
    RAISE NOTICE '✅ Column assigned_member_id added to appointments';
  ELSE
    RAISE NOTICE '⚠️ Column assigned_member_id already exists';
  END IF;
END $$;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINT
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_assigned_member_id_fkey'
  ) THEN
    ALTER TABLE appointments
    ADD CONSTRAINT appointments_assigned_member_id_fkey
    FOREIGN KEY (assigned_member_id) REFERENCES custom_users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ FK appointments_assigned_member_id_fkey added';
  ELSE
    RAISE NOTICE '⚠️ FK appointments_assigned_member_id_fkey already exists';
  END IF;
END $$;

-- ============================================================================
-- ADD INDEX FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_appointments_assigned_member_id
ON appointments(assigned_member_id) WHERE assigned_member_id IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  fk_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_assigned_member_id_fkey'
  ) INTO fk_exists;

  IF fk_exists THEN
    RAISE NOTICE '✅ Migration 023 completed. FK appointments_assigned_member_id_fkey exists.';
  ELSE
    RAISE WARNING '❌ Migration 023 failed. FK not created.';
  END IF;
END $$;
