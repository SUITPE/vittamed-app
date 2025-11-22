import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testEndpoint() {
  const tenantId = '33bfa2ef-c9c2-4eaa-8178-eed6d6df8d9e' // Dr. Gus

  console.log('\n=== Simulando query del endpoint /api/tenants/[tenantId]/users ===\n')
  console.log('Tenant ID:', tenantId)

  // Exact query from the endpoint
  const { data: tenantUsers, error: usersError } = await supabase
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
    .eq('tenant_id', tenantId)

  if (usersError) {
    console.error('\n❌ Error fetching tenant users:', {
      error: usersError,
      message: usersError.message,
      code: usersError.code,
      details: usersError.details,
      hint: usersError.hint,
      tenantId
    })
    return
  }

  console.log(`\n✅ Query exitoso - ${tenantUsers?.length || 0} usuarios encontrados:\n`)

  if (tenantUsers && tenantUsers.length > 0) {
    tenantUsers.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email}`)
      console.log(`   - Role: ${u.role}`)
      console.log(`   - Name: ${u.first_name} ${u.last_name}`)
      console.log(`   - Schedulable: ${u.schedulable}`)
      console.log(`   - Tenant ID: ${u.tenant_id}`)
      console.log('')
    })

    // Transform like the endpoint does
    const users = tenantUsers.map(user => {
      const schedulable = user.schedulable !== undefined
        ? user.schedulable
        : (user.role === 'doctor' || user.role === 'member')

      return {
        user_id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: user.role,
        tenant_id: user.tenant_id,
        schedulable,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    })

    console.log('=== Datos transformados (como los devuelve el endpoint) ===\n')
    console.log(JSON.stringify({ users, total: users.length }, null, 2))
  } else {
    console.log('⚠️  Lista vacía - Este es el problema')

    // Verify tenant exists
    console.log('\n=== Verificando si el tenant existe ===\n')
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle()

    if (tenantError) {
      console.log('❌ Error:', tenantError.message)
    } else if (tenant) {
      console.log('✅ Tenant existe:', tenant.name)
    } else {
      console.log('❌ Tenant NO existe con ID:', tenantId)
    }

    // Check users with this tenant_id
    console.log('\n=== Verificando usuarios con este tenant_id ===\n')
    const { data: allUsers, error: allError } = await supabase
      .from('custom_users')
      .select('id, email, role, tenant_id')
      .eq('tenant_id', tenantId)

    if (allError) {
      console.log('❌ Error:', allError.message)
    } else {
      console.log(`Encontrados: ${allUsers?.length || 0}`)
      allUsers?.forEach(u => {
        console.log(`- ${u.email} (${u.role})`)
      })
    }
  }
}

testEndpoint()
  .then(() => {
    console.log('\n✅ Test completado\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
