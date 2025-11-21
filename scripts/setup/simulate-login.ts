import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU'
const jwtSecret = 'vittasami-dev-secret-key-2024' // Default fallback

async function simulateLogin() {
  try {
    console.log('🚀 Simulating login API call...\n')

    const email = 'admin@vittasami.com'
    const password = 'VittaSami2025!Admin'

    console.log('1️⃣ Creating Supabase client...')
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    console.log('✅ Client created\n')

    console.log('2️⃣ Fetching user from custom_users...')
    const { data: user, error } = await supabase
      .from('custom_users')
      .select('*')
      .eq('email', email)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      return
    }

    if (!user) {
      console.error('❌ User not found')
      return
    }

    console.log('✅ User found:', user.email)
    console.log('   Role:', user.role)
    console.log('   Has hash:', !!user.password_hash, '\n')

    console.log('3️⃣ Verifying password...')
    const isMatch = await bcrypt.compare(password, user.password_hash)

    if (!isMatch) {
      console.error('❌ Password does not match')
      return
    }

    console.log('✅ Password verified\n')

    console.log('4️⃣ Generating JWT token...')
    const token = jwt.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id || undefined
    }, jwtSecret, { expiresIn: '7d' })

    console.log('✅ Token generated:', token.substring(0, 50) + '...\n')

    console.log('5️⃣ Determining redirect path...')
    let redirectPath = '/dashboard'

    switch (user.role) {
      case 'super_admin':
        redirectPath = '/admin/manage-users'
        break
      case 'admin_tenant':
        redirectPath = '/dashboard'
        break
      case 'doctor':
        redirectPath = '/agenda'
        break
      case 'receptionist':
        redirectPath = '/dashboard'
        break
      case 'patient':
        redirectPath = '/my-appointments'
        break
    }

    console.log('✅ Redirect path:', redirectPath, '\n')

    console.log('6️⃣ Preparing response...')
    const { password_hash, ...safeProfile } = user

    const response = {
      success: true,
      redirectPath,
      user: {
        id: user.id,
        email: user.email,
        profile: safeProfile
      }
    }

    console.log('✅ Response ready:\n')
    console.log(JSON.stringify(response, null, 2))

    console.log('\n🎉 Login simulation completed successfully!')

  } catch (error) {
    console.error('❌ ERROR during simulation:')
    console.error(error)
  }
}

simulateLogin()
