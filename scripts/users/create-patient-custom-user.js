const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
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

async function createPatientCustomUser() {
  const email = 'patient@example.com';

  console.log('Checking if patient exists in custom_users...');

  // Check if user already exists
  const { data: existingUser, error: selectError } = await supabase
    .from('custom_users')
    .select('*')
    .eq('email', email)
    .single();

  if (selectError && selectError.code !== 'PGRST116') {
    console.error('Error checking user:', selectError);
    return;
  }

  if (existingUser) {
    console.log('Patient already exists in custom_users:', existingUser);
    return;
  }

  console.log('Creating patient in custom_users table...');

  // Hash the password
  const password_hash = await bcrypt.hash('password', 12);

  // Create user in custom_users table
  const { data: newUser, error: insertError } = await supabase
    .from('custom_users')
    .insert({
      id: '05a980e0-11ea-4b7e-8abe-c7029b49853d',
      email: email,
      first_name: 'Test',
      last_name: 'Patient',
      role: 'patient',
      tenant_id: null,
      password_hash: password_hash,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (insertError) {
    console.error('Error creating patient:', insertError);
    return;
  }

  console.log('✅ Patient created successfully in custom_users!');
  console.log('User:', newUser);
  console.log('\nLogin credentials:');
  console.log('Email:', email);
  console.log('Password: password');
}

createPatientCustomUser().catch(console.error);
