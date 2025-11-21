import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAdmin() {
  try {
    console.log('🔍 Checking for admin@vittasami.com...')

    const { data, error } = await supabase
      .from('custom_users')
      .select('*')
      .eq('email', 'admin@vittasami.com')
      .single()

    if (error) {
      console.error('❌ Error:', error.message)
      return
    }

    if (data) {
      console.log('✅ Admin user found:')
      console.log('  ID:', data.id)
      console.log('  Email:', data.email)
      console.log('  Role:', data.role)
      console.log('  Name:', data.first_name, data.last_name)
      console.log('  Active:', data.is_active)
      console.log('  Has password hash:', !!data.password_hash)
      if (data.password_hash) {
        console.log('  Password hash preview:', data.password_hash.substring(0, 20) + '...')
      }
    } else {
      console.log('❌ Admin user NOT found')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkAdmin()
