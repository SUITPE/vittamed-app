import { createClient } from '@supabase/supabase-js'

// PRODUCTION database
const supabaseUrl = 'https://emtcplanfbmydqjbcuxm.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGNwbGFuZmJteWRxamJjdXhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzgyOSwiZXhwIjoyMDc4NjUzODI5fQ.yaWPAW9uy45SWEjQRR4jXzmkrDvkog0xi0T0fDtWRzQ'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkProdUser() {
  console.log('\n=== Verificando PRODUCCIÓN (emtcplanfbmydqjbcuxm) ===\n')

  // Check auth.users
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      console.log('❌ Error al listar usuarios de auth:', error)
    } else {
      console.log(`✅ Total usuarios en auth.users: ${users.length}`)

      const gusscassUser = users.find(u => u.email === 'gusscass@gmail.com')
      if (gusscassUser) {
        console.log('\n✅ ¡ENCONTRADO! gusscass@gmail.com en auth.users:')
        console.log('   ID:', gusscassUser.id)
        console.log('   Email:', gusscassUser.email)
        console.log('   Created:', gusscassUser.created_at)
        console.log('   Email confirmed:', gusscassUser.email_confirmed_at ? 'Sí' : 'No')

        // Now check custom_users
        const { data: customUser, error: customError } = await supabase
          .from('custom_users')
          .select('*')
          .eq('id', gusscassUser.id)
          .maybeSingle()

        if (customError) {
          console.log('\n❌ Error al buscar en custom_users:', customError)
        } else if (customUser) {
          console.log('\n✅ También en custom_users:')
          console.log('   Role:', customUser.role)
          console.log('   Tenant ID:', customUser.tenant_id || 'NULL')
          console.log('   First name:', customUser.first_name || '(sin nombre)')
          console.log('   Last name:', customUser.last_name || '(sin apellido)')
        } else {
          console.log('\n⚠️  NO está en custom_users (solo en auth.users)')
        }
      } else {
        console.log('\n❌ gusscass@gmail.com NO EXISTE en auth.users de PRODUCCIÓN')

        console.log('\nPrimeros 10 usuarios en PRODUCCIÓN:')
        users.slice(0, 10).forEach((u, i) => {
          console.log(`   ${i + 1}. ${u.email} - ${u.id}`)
        })
      }
    }
  } catch (e: any) {
    console.log('❌ Error:', e.message)
  }
}

checkProdUser()
  .then(() => {
    console.log('\n✅ Verificación completada\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
