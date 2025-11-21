const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log('🚀 Adding missing subscription plans...\n');

  // Insert 'care' plan
  const { data: care, error: careError } = await supabase
    .from('subscription_plans')
    .upsert({
      plan_key: 'care',
      plan_name: 'Plan Care',
      description: 'Gestión completa de clientes/pacientes',
      price_monthly: 39,
      price_yearly: 399,
      max_users: 5,
      max_appointments_per_month: 1000,
      is_active: true
    }, { onConflict: 'plan_key' });

  if (careError) {
    console.error('❌ Error inserting Care plan:', careError.message);
  } else {
    console.log('✅ Care plan inserted/updated');
  }

  // Insert 'pro' plan
  const { data: pro, error: proError } = await supabase
    .from('subscription_plans')
    .upsert({
      plan_key: 'pro',
      plan_name: 'Plan Pro',
      description: 'Funciones avanzadas con IA',
      price_monthly: 79,
      price_yearly: 803,
      max_users: 15,
      max_appointments_per_month: 5000,
      is_active: true
    }, { onConflict: 'plan_key' });

  if (proError) {
    console.error('❌ Error inserting Pro plan:', proError.message);
  } else {
    console.log('✅ Pro plan inserted/updated');
  }

  // Verify plans exist
  console.log('\n📊 Verifying plans...');
  const { data: plans, error: plansError } = await supabase
    .from('subscription_plans')
    .select('plan_key, plan_name, price_monthly')
    .in('plan_key', ['free', 'care', 'pro', 'enterprise'])
    .order('price_monthly');

  if (plansError) {
    console.error('❌ Error fetching plans:', plansError.message);
  } else {
    console.log('\nAll plans:');
    plans.forEach(plan => {
      console.log(`  - ${plan.plan_key}: ${plan.plan_name} ($${plan.price_monthly}/mo)`);
    });
  }

  console.log('\n✅ Plans setup complete!');
}

main().catch(console.error);
