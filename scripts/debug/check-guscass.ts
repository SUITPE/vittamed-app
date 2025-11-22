import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkGuscass() {
  console.log('\n=== Información completa de guscass@gmail.com ===\n')

  // Get from custom_users
  const { data: user, error } = await supabase
    .from('custom_users')
    .select('*')
    .eq('email', 'guscass@gmail.com')
    .single()

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  console.log('✅ Usuario encontrado en custom_users:')
  console.log('   ID:', user.id)
  console.log('   Email:', user.email)
  console.log('   Role:', user.role)
  console.log('   Tenant ID:', user.tenant_id || 'NULL')
  console.log('   First Name:', user.first_name || '(sin nombre)')
  console.log('   Last Name:', user.last_name || '(sin apellido)')
  console.log('   Schedulable:', user.schedulable)
  console.log('   Created:', user.created_at)

  // Check if exists in auth.users
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

  if (!authError) {
    const authUser = users.find(u => u.id === user.id)
    if (authUser) {
      console.log('\n✅ También en auth.users:')
      console.log('   Auth ID:', authUser.id)
      console.log('   Email confirmed:', authUser.email_confirmed_at ? 'Sí' : 'No')
      console.log('   Last sign in:', authUser.last_sign_in_at || 'Nunca')
    } else {
      console.log('\n⚠️  NO está en auth.users (no puede hacer login)')
    }
  }

  // Check if tenant exists
  if (user.tenant_id) {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', user.tenant_id)
      .maybeSingle()

    if (tenantError) {
      console.log('\n❌ Error al buscar tenant:', tenantError.message)
    } else if (tenant) {
      console.log('\n✅ Tenant asignado:')
      console.log('   Tenant ID:', tenant.id)
      console.log('   Tenant Name:', tenant.name)
      console.log('   Business Type:', tenant.business_type)
    } else {
      console.log('\n⚠️  Tenant ID existe pero no se encuentra en la tabla tenants')
    }

    // Check how many users in the same tenant
    const { data: tenantUsers, error: usersError } = await supabase
      .from('custom_users')
      .select('id, email, role')
      .eq('tenant_id', user.tenant_id)

    if (!usersError && tenantUsers) {
      console.log(`\n✅ Total de usuarios en el tenant: ${tenantUsers.length}`)
      tenantUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.email} - ${u.role}`)
      })
    }
  } else {
    console.log('\n⚠️  Usuario NO tiene tenant_id asignado')
  }
}

checkGuscass()
  .then(() => {
    console.log('\n✅ Verificación completada\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
