-- Update existing user_profiles to set schedulable based on role
-- This ensures doctors and members are marked as schedulable

UPDATE user_profiles
SET schedulable = true
WHERE role IN ('doctor', 'member') AND (schedulable IS NULL OR schedulable = false);

-- Verify the update
SELECT role, schedulable, COUNT(*) as count
FROM user_profiles
GROUP BY role, schedulable
ORDER BY role, schedulable;
