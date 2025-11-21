/**
 * Script para obtener listado de tablas desde Supabase Development
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzc5NDU2OCwiZXhwIjoyMDQzMzcwNTY4fQ.gGbBW3oMOr88xNkJ4_N2xv4YVlMOHC3bVQrQzl22F2A'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: { schema: 'public' }
})

async function getTables() {
  console.log('🔍 Consultando tablas...\n')

  // Query directo a información_schema
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'sql_%'
      ORDER BY table_name
    `
  })

  if (error) {
    // Si RPC no está disponible, intentar listar tablas conocidas
    console.log('⚠️  RPC no disponible, listando tablas conocidas del código:\n')
    const knownTables = [
      'tenants',
      'profiles',
      'doctors',
      'doctor_tenants',
      'doctor_availability',
      'doctor_breaks',
      'patients',
      'services',
      'appointments',
      'feature_flags',
      'tenant_features',
      'subscription_plans',
      'plan_features',
      'medical_histories',
      'webhook_logs',
      'payment_transactions',
      'icd10_codes'
    ]

    console.log('Tablas principales:')
    knownTables.forEach(table => console.log(`  - ${table}`))
    return knownTables
  }

  console.log('✅ Tablas encontradas:', data)
  return data
}

getTables()
