import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applySQL() {
  try {
    console.log('🚀 Connecting to Supabase staging database...')
    console.log('URL:', supabaseUrl)

    // Read SQL file
    const sqlPath = path.join(__dirname, '../database/create-custom-users-table-production.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('📝 SQL file loaded')

    // For Supabase, we need to use the SQL editor API or direct psql
    // Let's try to check if the table exists first
    const { data: tables, error: tableError } = await supabase
      .from('custom_users')
      .select('count')
      .limit(1)

    if (tableError) {
      console.log('⚠️ custom_users table does not exist:', tableError.message)
      console.log('📋 You need to run this SQL manually in Supabase SQL Editor:')
      console.log('URL: https://supabase.com/dashboard/project/mvvxeqhsatkqtsrulcil/sql')
      console.log('\n--- SQL TO EXECUTE ---')
      console.log(sql)
      console.log('\n--- END SQL ---')
    } else {
      console.log('✅ custom_users table already exists')
      console.log('Rows:', tables)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

applySQL()
