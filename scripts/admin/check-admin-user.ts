/**
 * Verificar estado del super admin user
 */

import { createClient } from '@supabase/supabase-js'

const PROD_URL = 'https://emtcplanfbmydqjbcuxm.supabase.co'
const PROD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGNwbGFuZmJteWRxamJjdXhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzgyOSwiZXhwIjoyMDc4NjUzODI5fQ.yaWPAW9uy45SWEjQRR4jXzmkrDvkog0xi0T0fDtWRzQ'

const supabase = createClient(PROD_URL, PROD_SERVICE_KEY)

async function checkAdminUser() {
  console.log('🔍 Verificando super admin user...\n')

  try {
    // 1. Verificar en auth.users usando admin API
    console.log('1️⃣  Verificando en auth.users...')
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error listando usuarios:', listError.message)
      return
    }

    console.log(`✅ Total usuarios en auth: ${users.length}`)

    const adminUser = users.find(u => u.email === 'admin@vittasami.com')

    if (adminUser) {
      console.log('✅ Usuario encontrado en auth.users:')
      console.log(`   ID: ${adminUser.id}`)
      console.log(`   Email: ${adminUser.email}`)
      console.log(`   Email Confirmed: ${adminUser.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`   Created: ${adminUser.created_at}`)
      console.log(`   Last Sign In: ${adminUser.last_sign_in_at || 'Never'}`)
      console.log(`   Phone: ${adminUser.phone || 'N/A'}`)
      console.log(`   User Metadata:`, JSON.stringify(adminUser.user_metadata, null, 2))
    } else {
      console.log('❌ Usuario NO encontrado en auth.users')
      console.log('Usuarios existentes:')
      users.forEach(u => console.log(`  - ${u.email}`))
    }

    // 2. Verificar en profiles
    console.log('\n2️⃣  Verificando en profiles...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@vittasami.com')

    if (profileError) {
      console.error('❌ Error consultando profiles:', profileError.message)
    } else if (profiles && profiles.length > 0) {
      console.log('✅ Perfil encontrado:')
      console.log(JSON.stringify(profiles[0], null, 2))
    } else {
      console.log('❌ Perfil NO encontrado en tabla profiles')
    }

    // 3. Intentar login para obtener error específico
    console.log('\n3️⃣  Intentando login con las credenciales...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@vittasami.com',
      password: 'VittaSami2025!Admin'
    })

    if (loginError) {
      console.log('❌ Error de login:', loginError.message)
      console.log('   Código:', loginError.status)

      if (loginError.message.includes('Email not confirmed')) {
        console.log('\n💡 SOLUCIÓN: El email no está confirmado')
        console.log('   Voy a confirmar el email automáticamente...')
      }
    } else {
      console.log('✅ Login exitoso!')
      console.log('   User ID:', loginData.user?.id)
      console.log('   Session válida hasta:', loginData.session?.expires_at)
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

checkAdminUser()
