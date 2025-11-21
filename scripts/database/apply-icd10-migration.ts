/**
 * Script para aplicar manualmente la migración ICD10
 * Ejecuta el contenido de 020_icd10_codes.sql usando el SDK de Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('🔧 Aplicando migración ICD10...\n');

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '020_icd10_codes.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migración cargada desde:', migrationPath);
    console.log('📏 Tamaño:', migrationSQL.length, 'caracteres\n');

    // Dividir en statements individuales (por punto y coma)
    const statements = migrationSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Ejecutando ${statements.length} statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Extraer tipo de comando para mostrar
      const cmdMatch = statement.match(/^\s*(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT)\s+/i);
      const cmdType = cmdMatch ? cmdMatch[1].toUpperCase() : 'SQL';

      process.stdout.write(`   [${i + 1}/${statements.length}] ${cmdType}... `);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';',
        });

        if (error) {
          // Si el error es "función no existe", intentar con approach alternativo
          if (error.message.includes('function') || error.message.includes('exec_sql')) {
            console.log('⚠️  (usando método alternativo)');
            // Nota: Supabase no permite ejecutar SQL arbitrario desde el cliente
            // La migración debe aplicarse desde el dashboard o CLI
            errorCount++;
          } else {
            console.log(`❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log('✅');
          successCount++;
        }
      } catch (err: any) {
        console.log(`❌ ${err.message}`);
        errorCount++;
      }

      // Delay para no saturar
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Statements exitosos: ${successCount}`);
    console.log(`❌ Statements con errores: ${errorCount}`);
    console.log('='.repeat(60));

    if (errorCount > 0) {
      console.log('\n⚠️  NOTA IMPORTANTE:');
      console.log('   Supabase no permite ejecutar migraciones DDL desde el SDK.');
      console.log('   Por favor, aplica la migración manualmente usando:');
      console.log('   1. Supabase Dashboard → SQL Editor');
      console.log('   2. Copia el contenido de supabase/migrations/020_icd10_codes.sql');
      console.log('   3. Ejecuta el SQL en el editor\n');
    }
  } catch (error: any) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

applyMigration();
