-- Migration 027: Add avatar_url to custom_users
-- VT-58: Foto de perfil del usuario
--
-- Adds avatar_url column to custom_users table for profile photos
-- Also creates Supabase Storage bucket for avatars

-- Add avatar_url column to custom_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE custom_users ADD COLUMN avatar_url TEXT;
    COMMENT ON COLUMN custom_users.avatar_url IS 'URL to user profile photo in Supabase Storage';
  END IF;
END $$;

-- Create storage bucket for avatars (if using Supabase Storage)
-- Note: This needs to be done via Supabase Dashboard or API
-- The bucket should be named 'avatars' with public access for reading

-- Add index for faster avatar lookups (optional, for future optimization)
-- CREATE INDEX IF NOT EXISTS idx_custom_users_avatar_url ON custom_users(avatar_url) WHERE avatar_url IS NOT NULL;
