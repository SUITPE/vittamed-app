import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUserData() {
  console.log('\n=== Verificando usuario gusscass@gmail.com ===\n')

  // 1. Check if user exists
  const { data: user, error: userError } = await supabase
    .from('custom_users')
    .select('id, email, role, tenant_id')
    .eq('email', 'gusscass@gmail.com')
    .maybeSingle()

  if (userError) {
    console.error('❌ Error al buscar usuario:', userError)
    return
  }

  if (!user) {
    console.log('❌ Usuario gusscass@gmail.com NO EXISTE en la base de datos\n')

    // List all users to see what exists
    console.log('=== Listando TODOS los usuarios en la base de datos ===\n')
    const { data: allUsers, error: allUsersError } = await supabase
      .from('custom_users')
      .select('id, email, role, tenant_id')
      .order('created_at', { ascending: false })
      .limit(50)

    if (allUsersError) {
      console.error('❌ Error al listar usuarios:', allUsersError)
      return
    }

    console.log(`✅ Encontrados ${allUsers?.length || 0} usuarios:`)
    allUsers?.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} - ${u.role} - tenant_id: ${u.tenant_id || 'NULL'}`)
    })

    return
  }

  console.log('✅ Usuario encontrado:')
  console.log('   Email:', user.email)
  console.log('   Role:', user.role)
  console.log('   Tenant ID:', user.tenant_id || 'NULL')
  console.log('   User ID:', user.id)

  // 2. Check if tenant_id is valid
  if (!user.tenant_id) {
    console.log('\n⚠️  Usuario no tiene tenant_id asignado')
    return
  }

  // 3. Check if there are other users in the same tenant
  console.log(`\n=== Verificando usuarios en tenant ${user.tenant_id} ===\n`)

  const { data: tenantUsers, error: tenantError } = await supabase
    .from('custom_users')
    .select('id, email, role')
    .eq('tenant_id', user.tenant_id)

  if (tenantError) {
    console.error('❌ Error al buscar usuarios del tenant:', tenantError)
    return
  }

  console.log(`✅ Encontrados ${tenantUsers?.length || 0} usuarios en el tenant:`)
  tenantUsers?.forEach((u, i) => {
    console.log(`   ${i + 1}. ${u.email} - ${u.role}`)
  })

  // 4. Test the actual query that the endpoint uses
  console.log(`\n=== Probando query del endpoint /api/tenants/${user.tenant_id}/users ===\n`)

  const { data: endpointData, error: endpointError } = await supabase
    .from('custom_users')
    .select(`
      id,
      email,
      first_name,
      last_name,
      role,
      tenant_id,
      schedulable,
      created_at,
      updated_at
    `)
    .eq('tenant_id', user.tenant_id)

  if (endpointError) {
    console.error('❌ Error en query del endpoint:', endpointError)
    return
  }

  console.log(`✅ Query del endpoint devuelve ${endpointData?.length || 0} usuarios`)
  if (endpointData && endpointData.length > 0) {
    console.log('\nPrimeros 5 usuarios:')
    endpointData.slice(0, 5).forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} - ${u.role} - ${u.first_name || '(sin nombre)'} ${u.last_name || ''}`)
    })
  } else {
    console.log('⚠️  Query devuelve array vacío - ESTE ES EL PROBLEMA')
  }
}

checkUserData()
  .then(() => {
    console.log('\n✅ Verificación completada\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
