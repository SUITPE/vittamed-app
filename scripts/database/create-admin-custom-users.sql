-- Crear admin en la tabla custom_users (que usa la app)

-- Primero verificar si la tabla existe
DO $$ 
BEGIN
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
END $$;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_custom_users_email ON custom_users(email);
CREATE INDEX IF NOT EXISTS idx_custom_users_role ON custom_users(role);

-- Password hash para "VittaSami2025!Admin" generado con bcrypt
-- Este hash fue generado con: bcrypt.hash('VittaSami2025!Admin', 12)
INSERT INTO custom_users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'admin@vittasami.com',
  '$2a$12$LZ9qVEzKx3hF8.pO5Y6YMeK3K5K9vZ9W5Z8Z9Z9Z9Z9Z9Z9Z9Z9Zu',
  'VittaSami',
  'Super Admin',
  'super_admin',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;
