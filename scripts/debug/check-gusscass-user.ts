import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUser() {
  const { data, error } = await supabase
    .from('custom_users')
    .select('id, email, first_name, last_name, role, tenant_id, created_at')
    .eq('email', 'gusscass@gmail.com')
    .single()

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('\n=== Usuario gusscass@gmail.com ===')
  console.log(JSON.stringify(data, null, 2))

  // Si tiene tenant_id, ver cuántos usuarios hay en ese tenant
  if (data.tenant_id) {
    const { data: tenantUsers, error: tenantError } = await supabase
      .from('custom_users')
      .select('id, email, role', { count: 'exact' })
      .eq('tenant_id', data.tenant_id)

    if (!tenantError && tenantUsers) {
      console.log(`\n=== Usuarios en tenant ${data.tenant_id} ===`)
      console.log(`Total: ${tenantUsers.length} usuarios`)
      tenantUsers.forEach(u => {
        console.log(`- ${u.email} (${u.role})`)
      })
    }
  }
}

checkUser()
