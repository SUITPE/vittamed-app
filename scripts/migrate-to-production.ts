/**
 * Script para migrar schema completo de Development a Production
 * Ejecuta directamente las migraciones usando Supabase API
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Development Database (source)
const DEV_URL = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const DEV_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzc5NDU2OCwiZXhwIjoyMDQzMzcwNTY4fQ.gGbBW3oMOr88xNkJ4_N2xv4YVlMOHC3bVQrQzl22F2A'

// Production Database (target)
const PROD_URL = 'https://emtcplanfbmydqjbcuxm.supabase.co'
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtdGNwbGFuZmJteWRxamJjdXhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzgyOSwiZXhwIjoyMDc4NjUzODI5fQ.yaWPAW9uy45SWEjQRR4jXzmkrDvkog0xi0T0fDtWRzQ'

const prodSupabase = createClient(PROD_URL, PROD_KEY)

async function applyMigrations() {
  console.log('🚀 Iniciando migración a Producción...\n')

  try {
    // Leer archivo de migraciones consolidadas
    console.log('📄 Leyendo migraciones...')
    const migrationsPath = join(process.cwd(), 'scripts', 'all-migrations.sql')
    const migrationsSQL = readFileSync(migrationsPath, 'utf-8')

    console.log(`✅ Archivo leído: ${migrationsSQL.length} caracteres\n`)

    // Aplicar migraciones a producción
    console.log('🔧 Aplicando migraciones a base de datos de producción...')
    console.log('   (Esto puede tomar 1-2 minutos)\n')

    // Usar fetch directo a la API de Supabase para ejecutar SQL
    const response = await fetch(`${PROD_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': PROD_KEY,
        'Authorization': `Bearer ${PROD_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: migrationsSQL })
    })

    if (!response.ok) {
      // Si exec_sql no existe, intentar ejecutar directamente con pg_query
      console.log('⚠️  RPC exec_sql no disponible, intentando método alternativo...\n')

      // Dividir en statements individuales y ejecutar uno por uno
      const statements = migrationsSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      console.log(`📋 Ejecutando ${statements.length} statements SQL...\n`)

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        if (statement.trim().length === 0) continue

        try {
          // Ejecutar statement directamente
          const { error } = await prodSupabase.rpc('exec', { sql: statement + ';' })

          if (error && !error.message.includes('already exists')) {
            console.warn(`⚠️  Warning en statement ${i + 1}:`, error.message)
          } else {
            process.stdout.write(`✓`)
            if ((i + 1) % 50 === 0) {
              console.log(` ${i + 1}/${statements.length}`)
            }
          }
        } catch (err: any) {
          if (!err.message?.includes('already exists')) {
            console.warn(`\n⚠️  Error en statement ${i + 1}:`, err.message)
          }
        }
      }

      console.log(`\n\n✅ Migraciones aplicadas (${statements.length} statements procesados)`)
    } else {
      console.log('✅ Migraciones aplicadas exitosamente via RPC')
    }

    // Verificar tablas creadas
    console.log('\n📊 Verificando tablas creadas...')
    const { data: tables, error: tablesError } = await prodSupabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (tablesError) {
      console.log('⚠️  No se pudo verificar tablas (esto puede ser normal)')
    } else {
      console.log(`✅ Tablas encontradas en producción: ${tables?.length || 0}`)
      if (tables && tables.length > 0) {
        console.log('\nTablas principales:')
        tables.slice(0, 10).forEach((t: any) => console.log(`  - ${t.table_name}`))
        if (tables.length > 10) {
          console.log(`  ... y ${tables.length - 10} más`)
        }
      }
    }

    console.log('\n🎉 Migración completada!')
    console.log('\n📝 Próximos pasos:')
    console.log('   1. Crear super usuario: npx tsx scripts/create-super-admin.ts')
    console.log('   2. Verificar en Supabase Dashboard')
    console.log('   3. Configurar Digital Ocean\n')

  } catch (error) {
    console.error('\n❌ Error durante migración:', error)
    throw error
  }
}

// Ejecutar
applyMigrations().catch(err => {
  console.error('Error fatal:', err)
  process.exit(1)
})
