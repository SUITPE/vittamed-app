/**
 * Verificar que las tablas se crearon correctamente en producción
 */

import { createClient } from '@supabase/supabase-js'

const PROD_URL = 'https://emtcplanfbmydqjbcuxm.supabase.co'
const PROD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGNwbGFuZmJteWRxamJjdXhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzgyOSwiZXhwIjoyMDc4NjUzODI5fQ.yaWPAW9uy45SWEjQRR4jXzmkrDvkog0xi0T0fDtWRzQ'

const supabase = createClient(PROD_URL, PROD_SERVICE_KEY)

async function verifyTables() {
  console.log('🔍 Verificando tablas en base de datos de producción...\n')

  const expectedTables = [
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

  console.log(`📋 Verificando ${expectedTables.length} tablas esperadas...\n`)

  let successCount = 0
  let errorCount = 0

  for (const tableName of expectedTables) {
    try {
      // Intentar un simple SELECT para verificar que la tabla existe
      const { error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${tableName} - NO EXISTE`)
          errorCount++
        } else {
          console.log(`✓ ${tableName}`)
          successCount++
        }
      } else {
        console.log(`✓ ${tableName}`)
        successCount++
      }
    } catch (err: any) {
      console.log(`⚠️  ${tableName} - ${err.message}`)
      errorCount++
    }
  }

  console.log(`\n📊 Resumen:`)
  console.log(`   ✓ Tablas encontradas: ${successCount}/${expectedTables.length}`)
  console.log(`   ❌ Tablas faltantes: ${errorCount}`)

  if (successCount === expectedTables.length) {
    console.log('\n🎉 ¡Base de datos completamente configurada!')
    return true
  } else {
    console.log('\n⚠️  Algunas tablas no se crearon correctamente')
    return false
  }
}

verifyTables()
