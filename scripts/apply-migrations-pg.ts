/**
 * Script para aplicar migraciones directamente usando PostgreSQL connection
 */

import { Client } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'

// Production Database Connection
// Usar conexión directa (puerto 5432) en lugar de pooler (6543)
const connectionString = 'postgresql://postgres:Hws4!SynJT&Qxo@db.emtcplanfbmydqjbcuxm.supabase.co:5432/postgres'

async function applyMigrations() {
  console.log('🚀 Conectando a base de datos de producción...\n')

  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Conectado exitosamente\n')

    // Leer migraciones
    console.log('📄 Leyendo archivo de migraciones...')
    const migrationsPath = join(process.cwd(), 'scripts', 'all-migrations.sql')
    const migrationsSQL = readFileSync(migrationsPath, 'utf-8')

    console.log(`✅ ${migrationsSQL.length} caracteres leídos\n`)

    // Dividir en statements individuales
    const statements = migrationsSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/))

    console.log(`📋 Ejecutando ${statements.length} SQL statements...\n`)

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'

      try {
        await client.query(statement)
        successCount++
        process.stdout.write('✓')

        if ((i + 1) % 50 === 0) {
          console.log(` ${i + 1}/${statements.length}`)
        }
      } catch (error: any) {
        // Ignorar errores de "already exists" - son normales
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate key')) {
          skipCount++
          process.stdout.write('○')
        } else {
          errorCount++
          process.stdout.write('✗')
          console.log(`\n⚠️  Error en statement ${i + 1}:`, error.message.split('\n')[0])
        }

        if ((i + 1) % 50 === 0) {
          console.log(` ${i + 1}/${statements.length}`)
        }
      }
    }

    console.log(`\n\n📊 Resumen:`)
    console.log(`   ✓ Exitosos: ${successCount}`)
    console.log(`   ○ Omitidos (ya existen): ${skipCount}`)
    console.log(`   ✗ Errores: ${errorCount}`)

    // Verificar tablas creadas
    console.log('\n📋 Verificando tablas en producción...')
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    console.log(`\n✅ ${result.rows.length} tablas encontradas:`)
    result.rows.forEach((row: any) => {
      console.log(`   - ${row.table_name}`)
    })

    console.log('\n🎉 Migración completada!')

  } catch (error) {
    console.error('\n❌ Error fatal:', error)
    throw error
  } finally {
    await client.end()
    console.log('\n🔌 Conexión cerrada\n')
  }
}

// Ejecutar
applyMigrations().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
