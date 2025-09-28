-- Add service_name column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_name TEXT;