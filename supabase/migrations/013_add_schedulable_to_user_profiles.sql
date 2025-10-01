-- Add schedulable field to user_profiles
-- This field determines if a user can be scheduled for appointments

ALTER TABLE user_profiles
ADD COLUMN schedulable BOOLEAN NOT NULL DEFAULT false;

-- Update existing records: doctors and members should be schedulable by default
UPDATE user_profiles
SET schedulable = true
WHERE role IN ('doctor', 'member');

-- Add comment to explain the column
COMMENT ON COLUMN user_profiles.schedulable IS 'Indicates if this user can be scheduled for appointments (true for doctors, members, etc.)';
