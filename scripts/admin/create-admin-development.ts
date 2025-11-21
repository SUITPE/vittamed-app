/**
 * Crear Super Admin en base de datos de DEVELOPMENT
 */

import { createClient } from '@supabase/supabase-js'

// Development Database
const DEV_URL = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const DEV_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU'

const supabase = createClient(DEV_URL, DEV_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminInDevelopment() {
  console.log('🔧 Creando super admin en base de datos de DEVELOPMENT...\n')

  try {
    // Verificar si ya existe
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      throw new Error(`Error listando usuarios: ${listError.message}`)
    }

    const existingAdmin = users.find(u => u.email === 'admin@vittasami.com')

    if (existingAdmin) {
      console.log('⚠️  Usuario admin@vittasami.com ya existe en development')
      console.log(`   ID: ${existingAdmin.id}`)
      console.log('   Usando usuario existente...\n')
      return existingAdmin
    }

    // Crear usuario
    console.log('1️⃣  Creando usuario en auth.users...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@vittasami.com',
      password: 'VittaSami2025!Admin',
      email_confirm: true,
      user_metadata: {
        full_name: 'VittaSami Super Admin',
        role: 'super_admin'
      }
    })

    if (authError) {
      throw new Error(`Error creando usuario: ${authError.message}`)
    }

    console.log(`✅ Usuario creado con ID: ${authData.user.id}\n`)

    // Crear perfil
    console.log('2️⃣  Creando perfil...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: 'admin@vittasami.com',
        full_name: 'VittaSami Super Admin',
        role: 'super_admin',
        is_active: true
      })

    if (profileError) {
      console.warn(`⚠️  Warning al crear perfil: ${profileError.message}`)
    } else {
      console.log('✅ Perfil creado\n')
    }

    console.log('🎉 Super Admin creado en DEVELOPMENT!')
    console.log('=====================================')
    console.log('📧 Email: admin@vittasami.com')
    console.log('🔑 Password: VittaSami2025!Admin')
    console.log('🆔 User ID:', authData.user.id)
    console.log('\n✅ Ahora puedes usar estas credenciales en staging\n')

    return authData.user

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

createAdminInDevelopment()
