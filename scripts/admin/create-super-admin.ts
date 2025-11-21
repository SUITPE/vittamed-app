/**
 * Script para crear Super Usuario Administrador en Producción
 *
 * Este usuario tendrá acceso global a todos los tenants y funcionalidad completa
 */

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

// Leer credenciales de producción desde .env.production o argumentos
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://emtcplanfbmydqjbcuxm.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGNwbGFuZmJteWRxamJjdXhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzgyOSwiZXhwIjoyMDc4NjUzODI5fQ.yaWPAW9uy45SWEjQRR4jXzmkrDvkog0xi0T0fDtWRzQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface AdminUserData {
  email: string
  password: string
  fullName: string
}

async function promptUserData(): Promise<AdminUserData> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer)
      })
    })
  }

  console.log('\n🔐 Crear Super Usuario Administrador')
  console.log('=====================================\n')

  const email = await question('Email del administrador (default: admin@vittasami.com): ') || 'admin@vittasami.com'
  const password = await question('Password (mínimo 8 caracteres): ')
  const fullName = await question('Nombre completo (default: VittaSami Admin): ') || 'VittaSami Admin'

  rl.close()

  // Validaciones
  if (!password || password.length < 8) {
    throw new Error('❌ Password debe tener al menos 8 caracteres')
  }

  if (!email.includes('@')) {
    throw new Error('❌ Email inválido')
  }

  return { email, password, fullName }
}

async function createSuperAdmin(userData: AdminUserData) {
  console.log('\n📝 Creando super usuario...')

  try {
    // 1. Crear usuario en auth.users
    console.log('1️⃣  Creando usuario de autenticación...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.fullName,
        role: 'super_admin'
      }
    })

    if (authError) {
      throw new Error(`Error al crear usuario: ${authError.message}`)
    }

    console.log(`✅ Usuario creado con ID: ${authData.user.id}`)

    // 2. Crear perfil en public.profiles
    console.log('2️⃣  Creando perfil de usuario...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.fullName,
        role: 'super_admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.warn(`⚠️  Warning al crear perfil: ${profileError.message}`)
      console.log('   (Esto puede ser normal si la tabla profiles no existe aún)')
    } else {
      console.log('✅ Perfil creado exitosamente')
    }

    // 3. Información final
    console.log('\n🎉 Super Usuario Administrador Creado!')
    console.log('=====================================')
    console.log(`📧 Email: ${userData.email}`)
    console.log(`🔑 Password: ${userData.password}`)
    console.log(`👤 Nombre: ${userData.fullName}`)
    console.log(`🎯 Role: super_admin`)
    console.log(`🆔 User ID: ${authData.user.id}`)
    console.log('\n⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro!')
    console.log('   Este usuario tiene acceso completo a todo el sistema.\n')

    return authData.user

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    throw error
  }
}

// Modo interactivo o argumentos de línea de comando
async function main() {
  try {
    let userData: AdminUserData

    // Verificar si se pasaron argumentos
    const args = process.argv.slice(2)
    if (args.length >= 2) {
      userData = {
        email: args[0],
        password: args[1],
        fullName: args[2] || 'VittaSami Admin'
      }
      console.log(`\n📋 Usando credenciales desde argumentos...`)
    } else {
      userData = await promptUserData()
    }

    await createSuperAdmin(userData)

  } catch (error) {
    console.error('\n❌ Error fatal:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main()
}

export { createSuperAdmin, AdminUserData }
