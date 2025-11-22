import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listTables() {
  console.log('\n=== Listando tablas relacionadas con usuarios ===\n')

  // Try different possible table names
  const tablesToCheck = [
    'custom_users',
    'users',
    'user_profiles',
    'profiles',
    'user_role_view',
    'auth.users'
  ]

  for (const tableName of tablesToCheck) {
    console.log(`\nVerificando tabla: ${tableName}`)
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`  ❌ Error: ${error.message}`)
      } else {
        console.log(`  ✅ Existe - ${count} registros`)
      }
    } catch (e: any) {
      console.log(`  ❌ Error: ${e.message}`)
    }
  }

  // Now let's check if gusscass@gmail.com exists in auth.users
  console.log('\n=== Verificando usuario en Supabase Auth ===\n')

  // Use admin API to list auth users
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.log('❌ Error al listar usuarios de auth:', error)
    } else {
      console.log(`✅ Total usuarios en auth.users: ${users.length}`)

      const gusscassUser = users.find(u => u.email === 'gusscass@gmail.com')
      if (gusscassUser) {
        console.log('\n✅ Usuario gusscass@gmail.com ENCONTRADO en auth.users:')
        console.log('   ID:', gusscassUser.id)
        console.log('   Email:', gusscassUser.email)
        console.log('   Created:', gusscassUser.created_at)
        console.log('   Email confirmed:', gusscassUser.email_confirmed_at ? 'Sí' : 'No')
      } else {
        console.log('\n❌ Usuario gusscass@gmail.com NO EXISTE en auth.users')

        // Show first 10 users
        console.log('\nPrimeros 10 usuarios en auth.users:')
        users.slice(0, 10).forEach((u, i) => {
          console.log(`   ${i + 1}. ${u.email} - ${u.id}`)
        })
      }
    }
  } catch (e: any) {
    console.log('❌ Error:', e.message)
  }
}

listTables()
  .then(() => {
    console.log('\n✅ Verificación completada\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
