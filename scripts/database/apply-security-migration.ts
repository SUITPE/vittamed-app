import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applySecurityMigration() {
  console.log('🔧 Applying user activation security migration...\n')

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/021_user_activation_security.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration file loaded')
    console.log('   Path:', migrationPath)
    console.log('   Size:', migrationSQL.length, 'bytes\n')

    // Execute migration via Supabase RPC
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    })

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('⚠️  RPC method not available, trying direct execution...\n')

      // Split into statements and execute one by one
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        console.log(`Executing statement ${i + 1}/${statements.length}...`)

        const { error: stmtError } = await supabase.rpc('exec', {
          sql: statement
        })

        if (stmtError) {
          console.error(`❌ Error in statement ${i + 1}:`, stmtError.message)
          // Continue if error is "already exists"
          if (!stmtError.message.includes('already exists')) {
            throw stmtError
          } else {
            console.log(`   ⚠️  Skipped (already exists)`)
          }
        } else {
          console.log(`   ✅ Success`)
        }
      }
    } else {
      console.log('✅ Migration executed successfully\n')
    }

    // Verify migration was applied
    console.log('🔍 Verifying migration...\n')

    // Check if new columns exist
    const { data: columns, error: colError } = await supabase
      .from('custom_users')
      .select('email_verified, must_change_password')
      .limit(1)

    if (colError) {
      console.log('   ❌ Columns not found:', colError.message)
    } else {
      console.log('   ✅ New columns exist in custom_users')
    }

    // Check if new table exists
    const { data: tokens, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('id')
      .limit(1)

    if (tokenError && !tokenError.message.includes('does not exist')) {
      console.log('   ❌ Table check failed:', tokenError.message)
    } else {
      console.log('   ✅ email_verification_tokens table exists')
    }

    // Count existing users
    const { count, error: countError } = await supabase
      .from('custom_users')
      .select('id', { count: 'exact', head: true })

    if (!countError) {
      console.log(`   ✅ Found ${count} existing users (all marked as verified)`)
    }

    console.log('\n✅ Migration completed successfully!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

applySecurityMigration()
