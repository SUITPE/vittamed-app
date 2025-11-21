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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createPatientUser() {
  const email = 'patient@example.com';
  const password = 'password';

  console.log('Checking if user exists...');

  // Check if user already exists
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existingUser = existingUsers.users.find(u => u.email === email);

  if (existingUser) {
    console.log('User already exists with ID:', existingUser.id);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', existingUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError);
    }

    if (!profile) {
      console.log('Creating profile for existing user...');
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: existingUser.id,
          email: email,
          role: 'patient',
          first_name: 'Test',
          last_name: 'Patient'
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
      } else {
        console.log('Profile created successfully');
      }
    } else {
      console.log('Profile already exists:', profile);
    }
    return;
  }

  console.log('Creating new user...');

  // Create new user
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

  console.log('User created with ID:', newUser.user.id);

  // Create profile
  console.log('Creating profile...');
  const { error: profileError2 } = await supabase
    .from('user_profiles')
    .insert({
      id: newUser.user.id,
      email: email,
      role: 'patient',
      first_name: 'Test',
      last_name: 'Patient'
    });

  const profileError = profileError2;

  if (profileError) {
    console.error('Error creating profile:', profileError);
  } else {
    console.log('Profile created successfully');
  }

  console.log('\n✅ Patient user created successfully!');
  console.log('Email:', email);
  console.log('Password:', password);
}

createPatientUser().catch(console.error);
