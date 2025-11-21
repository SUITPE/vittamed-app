import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('🔍 Testing login for admin@vittasami.com...\n')

  const email = 'admin@vittasami.com'
  const password = 'VittaSami2025!Admin'

  // Simulate the custom auth login process
  const { data: user, error } = await supabase
    .from('custom_users')
    .select('*')
    .eq('email', email)
    .single()

  if (error) {
    console.error('❌ Error finding user:', error.message)
    return
  }

  if (!user) {
    console.error('❌ User not found')
    return
  }

  console.log('✅ User found:')
  console.log('   Email:', user.email)
  console.log('   Role:', user.role)
  console.log('   Is Active:', user.is_active)
  console.log('')

  if (!user.password_hash) {
    console.error('❌ No password hash found')
    return
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash)

  if (isValid) {
    console.log('🎉 LOGIN SUCCESSFUL!')
    console.log('   Password verification: PASSED')
    console.log('')
    console.log('✅ Login credentials are working correctly!')
    console.log('   You can now login to the staging site with:')
    console.log('   Email: admin@vittasami.com')
    console.log('   Password: VittaSami2025!Admin')
  } else {
    console.error('❌ LOGIN FAILED - Invalid password')
  }
}

testLogin()
