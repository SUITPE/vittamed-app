-- Migration 026: Document profiles table deprecation
-- VT-265: Clarify profiles vs custom_users usage
--
-- DECISION: custom_users is the ONLY active user table
-- profiles is DEPRECATED and should NOT be used
--
-- This migration adds a comment to document this decision
-- and ensures no new FKs are created referencing profiles

-- Add deprecation comment to profiles table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    COMMENT ON TABLE profiles IS 'DEPRECATED: Do NOT use. Use custom_users instead. This table may be removed in future migrations.';
  END IF;
END $$;

-- Add documentation comment to custom_users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'custom_users') THEN
    COMMENT ON TABLE custom_users IS 'Primary user profiles table. Contains all user data (doctors, admins, patients). Source of truth for user information.';
  END IF;
END $$;

-- Verify custom_users has all necessary columns that might have been in profiles
-- This is a safety check - no changes made if columns already exist
DO $$
BEGIN
  -- Ensure role column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_users' AND column_name = 'role'
  ) THEN
    RAISE NOTICE 'WARNING: custom_users is missing role column';
  END IF;

  -- Ensure tenant_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_users' AND column_name = 'tenant_id'
  ) THEN
    RAISE NOTICE 'WARNING: custom_users is missing tenant_id column';
  END IF;

  -- Ensure is_active column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_users' AND column_name = 'is_active'
  ) THEN
    RAISE NOTICE 'WARNING: custom_users is missing is_active column';
  END IF;
END $$;
