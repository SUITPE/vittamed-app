const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = '/Users/alvaro/Projects/VittaSamiApp/.env.local';
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

async function fixPatientProfile() {
  const userId = '05a980e0-11ea-4b7e-8abe-c7029b49853d';
  const email = 'patient@example.com';

  console.log('Updating profile email to match auth user...');

  const { error } = await supabase
    .from('user_profiles')
    .update({
      email: email,
      first_name: 'Test',
      last_name: 'Patient'
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
  } else {
    console.log('✅ Profile updated successfully!');
    console.log('Email:', email);
  }

  // Verify the update
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  console.log('Updated profile:', profile);
}

fixPatientProfile().catch(console.error);
