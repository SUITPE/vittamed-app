const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listCustomUsers() {
  console.log('Listing all users in custom_users table...\n');

  const { data: users, error } = await supabase
    .from('custom_users')
    .select('id, email, role, first_name, last_name, tenant_id')
    .order('email');

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!users || users.length === 0) {
    console.log('No users found in custom_users table');
    return;
  }

  console.log(`Found ${users.length} users:\n`);
  users.forEach(user => {
    console.log(`- ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Name: ${user.first_name} ${user.last_name}`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Tenant: ${user.tenant_id || 'null'}`);
    console.log('');
  });
}

listCustomUsers().catch(console.error);
