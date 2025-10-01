-- Add phone column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add comment
COMMENT ON COLUMN user_profiles.phone IS 'Phone number for the user';
