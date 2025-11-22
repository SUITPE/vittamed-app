import { createClient } from '@supabase/supabase-js'

// STAGING database
const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function searchCustomUsers() {
  console.log('\n=== Buscando gusscass en custom_users (STAGING) ===\n')

  // 1. Buscar email exacto
  console.log('1. Búsqueda exacta: gusscass@gmail.com')
  const { data: exactMatch, error: exactError } = await supabase
    .from('custom_users')
    .select('*')
    .eq('email', 'gusscass@gmail.com')

  if (exactError) {
    console.log('   ❌ Error:', exactError.message)
  } else {
    console.log(`   ${exactMatch?.length ? '✅' : '❌'} Resultados: ${exactMatch?.length || 0}`)
    if (exactMatch && exactMatch.length > 0) {
      exactMatch.forEach(u => {
        console.log(`   - ID: ${u.id}`)
        console.log(`   - Email: ${u.email}`)
        console.log(`   - Role: ${u.role}`)
        console.log(`   - Tenant ID: ${u.tenant_id}`)
        console.log(`   - Name: ${u.first_name} ${u.last_name}`)
      })
    }
  }

  // 2. Buscar con LIKE (case insensitive)
  console.log('\n2. Búsqueda con LIKE: %gusscass%')
  const { data: likeMatch, error: likeError } = await supabase
    .from('custom_users')
    .select('*')
    .ilike('email', '%gusscass%')

  if (likeError) {
    console.log('   ❌ Error:', likeError.message)
  } else {
    console.log(`   ${likeMatch?.length ? '✅' : '❌'} Resultados: ${likeMatch?.length || 0}`)
    if (likeMatch && likeMatch.length > 0) {
      likeMatch.forEach(u => {
        console.log(`   - ID: ${u.id}`)
        console.log(`   - Email: ${u.email}`)
        console.log(`   - Role: ${u.role}`)
        console.log(`   - Tenant ID: ${u.tenant_id}`)
      })
    }
  }

  // 3. Buscar variaciones
  console.log('\n3. Búsqueda de variaciones:')
  const variations = [
    'Gusscass@gmail.com',
    'GUSSCASS@GMAIL.COM',
    'gusscass @gmail.com',
    ' gusscass@gmail.com',
    'gusscass@gmail.com '
  ]

  for (const email of variations) {
    const { data, error } = await supabase
      .from('custom_users')
      .select('email')
      .eq('email', email)

    if (!error && data && data.length > 0) {
      console.log(`   ✅ ENCONTRADO: "${email}"`)
    }
  }

  // 4. Listar todos los emails que contienen "gmail"
  console.log('\n4. Todos los emails con @gmail.com:')
  const { data: gmailUsers, error: gmailError } = await supabase
    .from('custom_users')
    .select('id, email, role')
    .ilike('email', '%@gmail.com%')
    .order('email')
    .limit(20)

  if (gmailError) {
    console.log('   ❌ Error:', gmailError.message)
  } else {
    console.log(`   Total: ${gmailUsers?.length || 0}`)
    gmailUsers?.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.email} - ${u.role}`)
    })
  }

  // 5. Contar total de registros
  console.log('\n5. Total de registros en custom_users:')
  const { count, error: countError } = await supabase
    .from('custom_users')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.log('   ❌ Error:', countError.message)
  } else {
    console.log(`   Total: ${count} registros`)
  }
}

searchCustomUsers()
  .then(() => {
    console.log('\n✅ Búsqueda completada\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
