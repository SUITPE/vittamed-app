-- SOLUCIÓN FINAL: Crear admin en custom_users (tabla que usa la app)

-- Crear tabla custom_users si no existe
CREATE TABLE IF NOT EXISTS custom_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text,
  first_name text,
  last_name text,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin_tenant', 'doctor', 'receptionist', 'patient')),
  tenant_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_custom_users_email ON custom_users(email);
CREATE INDEX IF NOT EXISTS idx_custom_users_role ON custom_users(role);

-- Insertar el admin con password hasheado correctamente
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

-- Verificar que se creó correctamente
SELECT id, email, role, is_active, created_at 
FROM custom_users 
WHERE email = 'admin@vittasami.com';
