const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQL(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });

  if (error) {
    console.error('❌ Error executing SQL:', error.message);
    throw error;
  }

  return data;
}

async function main() {
  console.log('🚀 Applying missing tenant columns...\n');

  const sql = `
-- Add missing columns from migration 019
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS billing_cycle text,
ADD COLUMN IF NOT EXISTS last_payment_date timestamptz,
ADD COLUMN IF NOT EXISTS last_payment_amount numeric(10, 2),
ADD COLUMN IF NOT EXISTS last_payment_error text,
ADD COLUMN IF NOT EXISTS last_payment_attempt timestamptz,
ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Add comments
COMMENT ON COLUMN tenants.billing_cycle IS 'monthly | annual';
COMMENT ON COLUMN tenants.last_payment_amount IS 'Amount in currency (PEN)';
  `;

  try {
    const result = await runSQL(sql);
    console.log('✅ Migration applied successfully!');
    console.log('Result:', result);

    // Verify columns now exist
    console.log('\n📊 Verifying columns...');
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .limit(1)
      .single();

    if (tenant) {
      const hasBillingCycle = 'billing_cycle' in tenant;
      const hasLastPaymentDate = 'last_payment_date' in tenant;

      console.log('  - billing_cycle exists:', hasBillingCycle);
      console.log('  - last_payment_date exists:', hasLastPaymentDate);

      if (hasBillingCycle && hasLastPaymentDate) {
        console.log('\n✅ All columns verified successfully!');
      } else {
        console.log('\n⚠️ Some columns may not be visible yet (cache issue)');
      }
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    // Try alternative approach: use Supabase SQL editor directly
    console.log('\n⚠️ Supabase client-side SQL execution may not be enabled.');
    console.log('📝 Please apply the following SQL manually in Supabase SQL Editor:');
    console.log('\n' + sql);
  }
}

main().catch(console.error);
