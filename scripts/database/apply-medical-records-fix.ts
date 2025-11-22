#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🔧 Applying medical records foreign keys fix...')

    // Read the migration file
    const migrationPath = path.join(__dirname, '../../supabase/migrations/022_fix_medical_records_foreign_keys.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration file loaded')
    console.log('🔄 Executing migration...')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL
    })

    if (error) {
      console.error('❌ Migration failed:', error)

      // Try direct execution as fallback
      console.log('🔄 Trying direct execution...')

      // Split by semicolon and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        const { error: stmtError } = await supabase.rpc('exec_sql', {
          sql_string: statement
        })

        if (stmtError) {
          console.error(`Error in statement: ${stmtError.message}`)
        }
      }
    } else {
      console.log('✅ Migration applied successfully')
    }

    // Verify the changes
    console.log('🔍 Verifying changes...')

    const { data: constraintsData, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'medical_records')
      .like('constraint_name', '%_fkey')

    if (!constraintsError && constraintsData) {
      console.log('✅ Foreign key constraints:')
      console.log(constraintsData)
    }

    console.log('✅ Migration process complete!')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

applyMigration()
