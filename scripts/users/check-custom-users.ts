import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCustomUsers() {
  console.log('🔍 Checking custom_users table...\n')

  // Check if table exists and get all users
  const { data, error } = await supabase
    .from('custom_users')
    .select('*')

  if (error) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Table might not exist yet. Need to run FINAL-ADMIN-FIX.sql')
    return
  }

  if (!data || data.length === 0) {
    console.log('⚠️  Table exists but no users found')
    console.log('💡 Need to run FINAL-ADMIN-FIX.sql to create admin user')
    return
  }

  console.log(`✅ Found ${data.length} user(s) in custom_users:\n`)

  data.forEach((user, index) => {
    console.log(`User ${index + 1}:`)
    console.log('   ID:', user.id)
    console.log('   Email:', user.email)
    console.log('   Role:', user.role)
    console.log('   First Name:', user.first_name)
    console.log('   Last Name:', user.last_name)
    console.log('   Has Password Hash:', !!user.password_hash)
    console.log('   Is Active:', user.is_active)
    console.log('')
  })

  // Specifically check for admin
  const admin = data.find(u => u.email === 'admin@vittasami.com')
  if (admin) {
    console.log('✅ Admin user EXISTS and is ready to login!')
  } else {
    console.log('⚠️  Admin user NOT FOUND - need to run FINAL-ADMIN-FIX.sql')
  }
}

checkCustomUsers()
