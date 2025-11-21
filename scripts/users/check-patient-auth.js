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

async function checkAndFixPatient() {
  const email = 'patient@example.com';
  const password = 'password';
  const userId = '05a980e0-11ea-4b7e-8abe-c7029b49853d';

  console.log('Checking auth user...');

  // List all users to find patient
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const patientUser = users.users.find(u => u.email === email);

  if (!patientUser) {
    console.log('Patient auth user NOT FOUND!');
    console.log('Creating new auth user...');

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'Patient'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return;
    }

    console.log('Created new user with ID:', newUser.user.id);

    // Update profile to match new user ID
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ id: newUser.user.id })
      .eq('email', email);

    if (updateError) {
      console.error('Error updating profile:', updateError);
    }
  } else {
    console.log('Patient auth user found with ID:', patientUser.id);
    console.log('Updating password to "password"...');

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      patientUser.id,
      { password: password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
    } else {
      console.log('✅ Password updated successfully!');
    }
  }

  console.log('\nPatient user should now login with:');
  console.log('Email:', email);
  console.log('Password:', password);
}

checkAndFixPatient().catch(console.error);
