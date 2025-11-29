-- Migration: 023_add_member_columns_to_appointments.sql
-- Ticket: VT-260 - Columna assigned_member_id no existe
-- Description: Add member_id and assigned_member_id columns to appointments table
-- Date: 2025-11-29

-- ============================================================================
-- ADD MEMBER COLUMNS TO APPOINTMENTS
-- ============================================================================

-- Add member_id column (member who actually provided the service - for completed appointments)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'member_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN member_id uuid;
    RAISE NOTICE 'Column member_id added to appointments';
  ELSE
    RAISE NOTICE 'Column member_id already exists in appointments';
  END IF;
END $$;

-- Add assigned_member_id column (member assigned to provide this service)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'assigned_member_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN assigned_member_id uuid;
    RAISE NOTICE 'Column assigned_member_id added to appointments';
  ELSE
    RAISE NOTICE 'Column assigned_member_id already exists in appointments';
  END IF;
END $$;

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- FK for member_id -> custom_users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_member_id_fkey'
  ) THEN
    ALTER TABLE appointments
    ADD CONSTRAINT appointments_member_id_fkey
    FOREIGN KEY (member_id) REFERENCES custom_users(id) ON DELETE SET NULL;
    RAISE NOTICE 'FK appointments_member_id_fkey added';
  ELSE
    RAISE NOTICE 'FK appointments_member_id_fkey already exists';
  END IF;
END $$;

-- FK for assigned_member_id -> custom_users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'appointments_assigned_member_id_fkey'
  ) THEN
    ALTER TABLE appointments
    ADD CONSTRAINT appointments_assigned_member_id_fkey
    FOREIGN KEY (assigned_member_id) REFERENCES custom_users(id) ON DELETE SET NULL;
    RAISE NOTICE 'FK appointments_assigned_member_id_fkey added';
  ELSE
    RAISE NOTICE 'FK appointments_assigned_member_id_fkey already exists';
  END IF;
END $$;

-- ============================================================================
-- ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for querying appointments by member
CREATE INDEX IF NOT EXISTS idx_appointments_member_id
ON appointments(member_id) WHERE member_id IS NOT NULL;

-- Index for querying appointments by assigned member
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_member_id
ON appointments(assigned_member_id) WHERE assigned_member_id IS NOT NULL;

-- Composite index for tenant + assigned_member queries
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_assigned_member
ON appointments(tenant_id, assigned_member_id) WHERE assigned_member_id IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN appointments.member_id IS 'Member who actually provided the service (set when appointment is completed)';
COMMENT ON COLUMN appointments.assigned_member_id IS 'Member assigned to provide this service (set at booking time)';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'appointments'
  AND column_name IN ('member_id', 'assigned_member_id');

  IF col_count = 2 THEN
    RAISE NOTICE '✅ Migration 023 completed successfully. Both columns exist.';
  ELSE
    RAISE WARNING '⚠️ Migration 023 may have issues. Expected 2 columns, found %', col_count;
  END IF;
END $$;
