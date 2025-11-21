/**
 * Debug completo del problema de login
 */

import { createClient } from '@supabase/supabase-js'

// Development Database (staging usa esta)
const DEV_URL = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const DEV_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw'
const DEV_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU'

async function debugLogin() {
  console.log('🔍 DEBUGGING LOGIN ISSUE\n')
  console.log('Database: DEVELOPMENT (mvvxeqhsatkqtsrulcil)')
  console.log('URL:', DEV_URL, '\n')

  // Cliente con service key para admin
  const adminClient = createClient(DEV_URL, DEV_SERVICE_KEY)

  // Cliente con anon key (como la app)
  const anonClient = createClient(DEV_URL, DEV_ANON_KEY)

  try {
    // 1. Verificar usuario en auth
    console.log('1️⃣  Verificando usuario en auth.users...')
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error:', listError.message)
      return
    }

    const adminUser = users.find(u => u.email === 'admin@vittasami.com')

    if (!adminUser) {
      console.log('❌ Usuario NO existe en auth.users')
      return
    }

    console.log('✅ Usuario encontrado:')
    console.log('   ID:', adminUser.id)
    console.log('   Email:', adminUser.email)
    console.log('   Email Confirmed:', adminUser.email_confirmed_at ? 'YES' : 'NO')
    console.log('   Banned:', adminUser.banned_until ? 'YES' : 'NO')

    // 2. Verificar si existe tabla profiles
    console.log('\n2️⃣  Verificando tabla profiles...')
    const { data: profilesCheck, error: profilesError } = await adminClient
      .from('profiles')
      .select('*')
      .limit(1)

    if (profilesError) {
      if (profilesError.message.includes('does not exist')) {
        console.log('❌ Tabla profiles NO EXISTE en development')
        console.log('   ⚠️  Esta es la causa del problema!')
        console.log('\n💡 SOLUCIÓN: Necesitamos crear el schema base en development')
      } else {
        console.log('⚠️  Error consultando profiles:', profilesError.message)
      }
    } else {
      console.log('✅ Tabla profiles existe')

      // Verificar si el perfil del admin existe
      const { data: adminProfile, error: profileError } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', adminUser.id)
        .single()

      if (profileError || !adminProfile) {
        console.log('❌ Perfil del admin NO existe')
      } else {
        console.log('✅ Perfil del admin existe:')
        console.log('   Role:', adminProfile.role)
        console.log('   Active:', adminProfile.is_active)
      }
    }

    // 3. Intentar login con anon client (como lo hace la app)
    console.log('\n3️⃣  Intentando login con anon key (como la app)...')
    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: 'admin@vittasami.com',
      password: 'VittaSami2025!Admin'
    })

    if (loginError) {
      console.log('❌ LOGIN FAILED:', loginError.message)
      console.log('   Status:', loginError.status)
      console.log('   Code:', loginError.code)
    } else {
      console.log('✅ LOGIN SUCCESSFUL!')
      console.log('   User ID:', loginData.user?.id)
      console.log('   Session expires:', new Date(loginData.session.expires_at! * 1000))
    }

    // 4. Verificar RLS policies
    console.log('\n4️⃣  Verificando RLS en profiles...')
    const { data: rlsCheck, error: rlsError } = await adminClient.rpc('exec', {
      sql: `
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'profiles'
      `
    })

    if (rlsError) {
      console.log('⚠️  No se pudo verificar RLS (tabla profiles puede no existir)')
    }

  } catch (error: any) {
    console.error('\n❌ Error fatal:', error.message)
  }
}

debugLogin()
