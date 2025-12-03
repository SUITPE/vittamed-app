-- Migration: 025_update_role_constraint.sql
-- Ticket: VT-262 - Rol "member" no existe en constraint
-- Description: Update role CHECK constraint to include 'staff' and 'member' roles
-- Date: 2025-11-29

-- ============================================================================
-- UPDATE ROLE CONSTRAINT ON custom_users TABLE
-- ============================================================================

-- The current constraint only allows:
-- 'super_admin', 'admin_tenant', 'doctor', 'receptionist', 'patient'
--
-- We need to add:
-- 'staff' - General staff members
-- 'member' - Service providers (for spas, wellness centers, etc.)

-- Step 1: Find and drop the existing CHECK constraint
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Find the constraint name for the role column
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
  WHERE rel.relname = 'custom_users'
    AND att.attname = 'role'
    AND con.contype = 'c';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE custom_users DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Dropped existing constraint: %', constraint_name;
  ELSE
    RAISE NOTICE 'No existing role constraint found on custom_users';
  END IF;
END $$;

-- Step 2: Add the new CHECK constraint with all roles
ALTER TABLE custom_users
ADD CONSTRAINT custom_users_role_check
CHECK (role IN (
  'super_admin',    -- Global admin (no tenant)
  'admin_tenant',   -- Tenant administrator
  'staff',          -- General staff
  'receptionist',   -- Receptionist
  'doctor',         -- Doctor/medical professional
  'member',         -- Service provider (spa, wellness)
  'patient'         -- Patient/client
));

-- ============================================================================
-- ALSO UPDATE profiles TABLE IF IT EXISTS (for backwards compatibility)
-- ============================================================================

DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Check if profiles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Find and drop existing constraint
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'profiles'
      AND att.attname = 'role'
      AND con.contype = 'c';

    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE profiles DROP CONSTRAINT %I', constraint_name);
      RAISE NOTICE 'Dropped existing constraint on profiles: %', constraint_name;
    END IF;

    -- Add new constraint
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN (
      'super_admin',
      'admin_tenant',
      'staff',
      'receptionist',
      'doctor',
      'member',
      'patient'
    ));

    RAISE NOTICE 'Updated role constraint on profiles table';
  ELSE
    RAISE NOTICE 'profiles table does not exist, skipping';
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT custom_users_role_check ON custom_users IS
'Valid roles: super_admin (global), admin_tenant, staff, receptionist, doctor, member (service provider), patient';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  constraint_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'custom_users_role_check'
  ) INTO constraint_exists;

  IF constraint_exists THEN
    RAISE NOTICE '✅ Migration 025 completed. Role constraint updated with staff and member roles.';
  ELSE
    RAISE WARNING '⚠️ Migration 025 may have issues. Constraint not found.';
  END IF;
END $$;
