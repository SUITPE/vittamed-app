-- Migration: Add profile fields to custom_users table
-- Created: 2025-10-15
-- Description: Adds phone, date_of_birth, and address fields to custom_users table

-- Add columns if they don't exist (safe idempotent script)

-- Add phone column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE custom_users ADD COLUMN phone VARCHAR(20);
    RAISE NOTICE 'Column phone added to custom_users';
  ELSE
    RAISE NOTICE 'Column phone already exists in custom_users';
  END IF;
END $$;

-- Add date_of_birth column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_users' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE custom_users ADD COLUMN date_of_birth DATE;
    RAISE NOTICE 'Column date_of_birth added to custom_users';
  ELSE
    RAISE NOTICE 'Column date_of_birth already exists in custom_users';
  END IF;
END $$;

-- Add address column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_users' AND column_name = 'address'
  ) THEN
    ALTER TABLE custom_users ADD COLUMN address TEXT;
    RAISE NOTICE 'Column address added to custom_users';
  ELSE
    RAISE NOTICE 'Column address already exists in custom_users';
  END IF;
END $$;

-- Add comments to document the columns
COMMENT ON COLUMN custom_users.phone IS 'User phone number with country code (e.g., +51 999 999 999)';
COMMENT ON COLUMN custom_users.date_of_birth IS 'User date of birth for age calculation';
COMMENT ON COLUMN custom_users.address IS 'User full address (street, city, postal code)';

-- Create index on phone for faster lookups (optional but recommended)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'custom_users' AND indexname = 'idx_custom_users_phone'
  ) THEN
    CREATE INDEX idx_custom_users_phone ON custom_users(phone) WHERE phone IS NOT NULL;
    RAISE NOTICE 'Index idx_custom_users_phone created';
  ELSE
    RAISE NOTICE 'Index idx_custom_users_phone already exists';
  END IF;
END $$;

-- Display final schema
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'custom_users'
ORDER BY ordinal_position;
