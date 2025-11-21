-- Verificar estado completo del admin
SELECT 
  'Usuario en auth.users' as tipo,
  id::text,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  NULL as role,
  NULL as is_active
FROM auth.users 
WHERE email = 'admin@vittasami.com'

UNION ALL

SELECT 
  'Perfil en profiles' as tipo,
  id::text,
  email,
  NULL as email_confirmed,
  role,
  is_active
FROM profiles 
WHERE email = 'admin@vittasami.com';
