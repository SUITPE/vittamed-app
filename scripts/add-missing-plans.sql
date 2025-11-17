-- Add missing subscription plans to match pricing.ts
INSERT INTO subscription_plans (plan_key, plan_name, description, price_monthly, price_yearly, max_users, max_appointments_per_month, is_active) VALUES
  ('care', 'Plan Care', 'Gestión completa de clientes/pacientes', 39, 399, 5, 1000, true),
  ('pro', 'Plan Pro', 'Funciones avanzadas con IA', 79, 803, 15, 5000, true)
ON CONFLICT (plan_key) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_users = EXCLUDED.max_users,
  max_appointments_per_month = EXCLUDED.max_appointments_per_month,
  is_active = EXCLUDED.is_active;

SELECT 'Plans inserted/updated successfully' as result;
