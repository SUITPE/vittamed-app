import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdmin() {
  console.log('🔐 Creating admin user in custom_users table...\n')

  const password = 'VittaSami2025!Admin'
  const passwordHash = '$2b$12$UZDmRWB4QizqBvwMlJb7GerqAkVisPf6FCTFyY5nA5Mk3LuveVkiK'

  // Verify the hash is correct
  const isValid = await bcrypt.compare(password, passwordHash)
  console.log('✅ Password hash validation:', isValid ? 'CORRECT' : 'INCORRECT')
  console.log('')

  // Insert admin user
  const { data, error } = await supabase
    .from('custom_users')
    .upsert({
      email: 'admin@vittasami.com',
      password_hash: passwordHash,
      first_name: 'VittaSami',
      last_name: 'Super Admin',
      role: 'super_admin',
      is_active: true
    }, {
      onConflict: 'email'
    })
    .select()

  if (error) {
    console.error('❌ Error creating admin:', error.message)
    return
  }

  console.log('✅ Admin user created/updated successfully!')

  // Verify it was created
  const { data: verifyData, error: verifyError } = await supabase
    .from('custom_users')
    .select('*')
    .eq('email', 'admin@vittasami.com')
    .single()

  if (verifyError) {
    console.error('❌ Error verifying admin:', verifyError.message)
    return
  }

  console.log('\n📋 Admin User Details:')
  console.log('   ID:', verifyData.id)
  console.log('   Email:', verifyData.email)
  console.log('   Role:', verifyData.role)
  console.log('   First Name:', verifyData.first_name)
  console.log('   Last Name:', verifyData.last_name)
  console.log('   Has Password Hash:', !!verifyData.password_hash)
  console.log('   Is Active:', verifyData.is_active)
  console.log('')
  console.log('🎉 You can now login with:')
  console.log('   Email: admin@vittasami.com')
  console.log('   Password: VittaSami2025!Admin')
}

createAdmin()
