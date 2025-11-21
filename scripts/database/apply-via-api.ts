/**
 * Aplicar migraciones usando Supabase Management API
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const PROD_URL = 'https://emtcplanfbmydqjbcuxm.supabase.co'
const PROD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGNwbGFuZmJteWRxamJjdXhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzgyOSwiZXhwIjoyMDc4NjUzODI5fQ.yaWPAW9uy45SWEjQRR4jXzmkrDvkog0xi0T0fDtWRzQ'

async function executeSQLViaREST(sql: string) {
  // Supabase permite ejecutar queries via REST usando el endpoint /rest/v1/rpc
  // Pero primero necesitamos crear una función RPC

  const createExecFunction = `
    CREATE OR REPLACE FUNCTION exec(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `

  try {
    // Intentar crear la función exec
    const createResponse = await fetch(`${PROD_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': PROD_SERVICE_KEY,
        'Authorization': `Bearer ${PROD_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: createExecFunction })
    })

    console.log('Intentando crear función exec...', createResponse.status)

    // Leer migraciones
    console.log('\n📄 Leyendo migraciones...')
    const migrationsPath = join(process.cwd(), 'scripts', 'all-migrations.sql')
    const migrationsSQL = readFileSync(migrationsPath, 'utf-8')

    console.log(`✅ ${migrationsSQL.length} caracteres\n`)

    // Ejecutar SQL completo
    console.log('🔧 Ejecutando migraciones...\n')
    const execResponse = await fetch(`${PROD_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': PROD_SERVICE_KEY,
        'Authorization': `Bearer ${PROD_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: migrationsSQL })
    })

    if (!execResponse.ok) {
      const error = await execResponse.text()
      console.log('❌ Error:', execResponse.status, error)
      throw new Error(`HTTP ${execResponse.status}: ${error}`)
    }

    console.log('✅ Migraciones aplicadas!')
    return true

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Aplicando migraciones via Supabase REST API...\n')

  const success = await executeSQLViaREST('')

  if (success) {
    console.log('\n🎉 Proceso completado!')
  } else {
    console.log('\n⚠️  No se pudo aplicar via API')
    console.log('\n💡 Alternativa: Copiar SQL manualmente en Supabase Dashboard')
    console.log('   1. Abrir: https://supabase.com/dashboard/project/emtcplanfbmydqjbcuxm/sql/new')
    console.log('   2. Copiar contenido de: scripts/all-migrations.sql')
    console.log('   3. Pegar y ejecutar en SQL Editor')
  }
}

main()
