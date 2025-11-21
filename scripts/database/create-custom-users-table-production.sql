-- Create custom_users table for production
-- This is the table that the application uses for authentication

-- Create table
CREATE TABLE IF NOT EXISTS custom_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text,
  first_name text,
  last_name text,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin_tenant', 'doctor', 'receptionist', 'patient', 'staff')),
  tenant_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_custom_users_email ON custom_users(email);
CREATE INDEX IF NOT EXISTS idx_custom_users_role ON custom_users(role);
CREATE INDEX IF NOT EXISTS idx_custom_users_tenant_id ON custom_users(tenant_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_custom_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_custom_users_updated_at ON custom_users;
CREATE TRIGGER update_custom_users_updated_at
  BEFORE UPDATE ON custom_users
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_users_updated_at();

-- Insert admin user with bcrypt hashed password
INSERT INTO custom_users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'admin@vittasami.com',
  '$2b$12$UZDmRWB4QizqBvwMlJb7GerqAkVisPf6FCTFyY5nA5Mk3LuveVkiK',
  'VittaSami',
  'Super Admin',
  'super_admin',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2b$12$UZDmRWB4QizqBvwMlJb7GerqAkVisPf6FCTFyY5nA5Mk3LuveVkiK',
  first_name = 'VittaSami',
  last_name = 'Super Admin',
  role = 'super_admin',
  is_active = true;

-- Verify admin was created
SELECT
  id,
  email,
  role,
  first_name,
  last_name,
  is_active,
  created_at
FROM custom_users
WHERE email = 'admin@vittasami.com';
