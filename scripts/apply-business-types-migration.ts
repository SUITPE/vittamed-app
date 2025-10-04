import { createClient } from '@/lib/supabase-server';
import fs from 'fs';
import path from 'path';

async function applyMigration() {
  console.log('🔍 Checking current tenant_type values...\n');

  const supabase = await createClient();

  // Check current enum values
  const { data: currentTypes, error: checkError } = await supabase
    .from('tenants')
    .select('tenant_type')
    .limit(10);

  if (checkError) {
    console.error('Error checking current types:', checkError);
  } else {
    console.log('Current tenant types in use:', [...new Set(currentTypes?.map(t => t.tenant_type))]);
  }

  console.log('\n📋 Reading migration file...\n');

  const migrationPath = path.join(process.cwd(), 'supabase/migrations/002_expand_business_types.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('Migration SQL loaded (', migrationSQL.length, 'characters)');
  console.log('\n⚠️  This migration needs to be applied via Supabase Dashboard SQL Editor');
  console.log('or using a proper migration tool.\n');
  console.log('Migration file: supabase/migrations/002_expand_business_types.sql\n');

  // Test if types are already available
  console.log('🧪 Testing if new business types are already available...\n');

  const { data: testData, error: testError } = await supabase
    .from('tenants')
    .select('*')
    .or('tenant_type.eq.medical_clinic,tenant_type.eq.dental_clinic')
    .limit(1);

  if (!testError) {
    console.log('✅ Query successful - new business types appear to be available!');
    if (testData && testData.length > 0) {
      console.log('Found', testData.length, 'tenant(s) using new business types');
    } else {
      console.log('No tenants using new types yet, but the types are available in the schema');
    }
  } else {
    console.log('❌ New business types NOT yet available');
    console.log('Error:', testError.message);
    console.log('\n📝 Action required: Apply migration via Supabase Dashboard');
  }
}

applyMigration().catch(console.error);
