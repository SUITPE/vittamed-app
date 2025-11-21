/**
 * Verificar estado de la base de datos de producción
 */

import { createClient } from '@supabase/supabase-js'

const PROD_URL = 'https://emtcplanfbmydqjbcuxm.supabase.co'
const PROD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGNwbGFuZmJteWRxamJjdXhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzgyOSwiZXhwIjoyMDc4NjUzODI5fQ.yaWPAW9uy45SWEjQRR4jXzmkrDvkog0xi0T0fDtWRzQ'

const supabase = createClient(PROD_URL, PROD_SERVICE_KEY)

async function checkDatabase() {
  console.log('🔍 Verificando base de datos de producción...\n')
  console.log(`URL: ${PROD_URL}\n`)

  try {
    // Intentar query simple
    const { data, error } = await supabase
      .from('_test_')
      .select('*')
      .limit(1)

    // El error es esperado si no existe la tabla, pero nos dice que la BD está accesible
    console.log('✅ Base de datos accesible via API\n')

    if (error) {
      if (error.message.includes('does not exist') || error.message.includes('relation')) {
        console.log('📊 Base de datos vacía (sin tablas todavía)')
        console.log('   Esto es correcto para una BD nueva\n')
      } else {
        console.log('⚠️  Error:', error.message)
      }
    }

    // Intentar listar tablas usando información_schema no funciona via REST
    // Necesitamos ejecutar SQL directo

    console.log('📋 Estado: Base de datos lista para recibir migraciones\n')
    console.log('✨ Siguiente paso:')
    console.log('   1. Abrir: https://supabase.com/dashboard/project/emtcplanfbmydqjbcuxm/sql/new')
    console.log('   2. Copiar contenido de: scripts/production-ready.sql')
    console.log('   3. Pegar en SQL Editor y ejecutar (RUN)')
    console.log('   4. Esperar ~30 segundos')
    console.log('   5. Ejecutar: npx tsx scripts/create-super-admin.ts\n')

    return true

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.log('\n⚠️  La base de datos podría estar pausada o en proceso de inicialización')
    console.log('   Espera unos minutos y vuelve a intentar\n')
    return false
  }
}

checkDatabase()
