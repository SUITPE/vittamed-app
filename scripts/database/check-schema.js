const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // Get first tenant to see schema
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching tenant:', error.message);
    console.log('\nTrying to get any tenant...');
    const { data: allData, error: allError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);

    if (allError) {
      console.error('Error:', allError);
      return;
    }

    if (allData && allData.length > 0) {
      console.log('Tenant columns:', Object.keys(allData[0]));
      console.log('Sample tenant:', allData[0]);

      const hasSubscriptionFields = 'subscription_plan_key' in allData[0];
      console.log('\n✅ Has subscription fields?', hasSubscriptionFields);
    }
    return;
  }

  console.log('Tenant columns:', Object.keys(data));
  console.log('Sample tenant:', JSON.stringify(data, null, 2));

  // Check if subscription fields exist
  const hasSubscriptionFields = 'subscription_plan_key' in data;
  console.log('\n✅ Has subscription fields?', hasSubscriptionFields);

  if (hasSubscriptionFields) {
    console.log('  - subscription_plan_key:', data.subscription_plan_key);
    console.log('  - subscription_status:', data.subscription_status);
    console.log('  - billing_cycle:', data.billing_cycle);
  }
}

main().catch(console.error);
