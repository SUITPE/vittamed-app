-- Actualizar el perfil del admin que ya existe
UPDATE profiles 
SET 
  full_name = 'VittaSami Super Admin',
  role = 'super_admin',
  is_active = true,
  updated_at = timezone('utc'::text, now())
WHERE email = 'admin@vittasami.com';
