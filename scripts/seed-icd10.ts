/**
 * Script de Seed: Cargar códigos CIE-10 a la base de datos
 *
 * TASK: TASK-BE-041
 * Epic: EPIC-004 (Historias Clínicas Inteligentes)
 *
 * Carga el dataset completo de códigos CIE-10 en español desde:
 * scripts/data/icd10-es.json
 *
 * Requisitos:
 * - Extensión pg_trgm habilitada en Supabase
 * - Variable SUPABASE_SERVICE_ROLE_KEY configurada
 * - Migración 020_icd10_codes.sql ejecutada
 *
 * Uso:
 * npm run seed:icd10
 *
 * O directamente:
 * npx ts-node scripts/seed-icd10.ts
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

interface ICD10Code {
  code: string;
  description: string;
  category: string;
  chapter_code: string;
  chapter_name: string;
  parent_code?: string;
  search_terms?: string[];
  includes_note?: string;
  excludes_note?: string;
  is_billable?: boolean;
}

// Configuración de Supabase (usa SERVICE_ROLE_KEY para bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Función principal de seed
 */
async function seedICD10() {
  console.log('🏥 Iniciando seed de códigos CIE-10...\n');

  try {
    // 1. Verificar que la tabla existe
    console.log('📋 Verificando tabla icd10_codes...');
    const { error: tableCheckError } = await supabase
      .from('icd10_codes')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      console.error('❌ Error: La tabla icd10_codes no existe');
      console.error('   Ejecuta primero: supabase migration up 020_icd10_codes.sql');
      console.error('   Detalle:', tableCheckError.message);
      process.exit(1);
    }

    // 2. Leer dataset de CIE-10
    const dataPath = path.join(__dirname, 'data', 'icd10-es.json');
    console.log(`📂 Leyendo dataset desde: ${dataPath}`);

    if (!fs.existsSync(dataPath)) {
      console.error(`❌ Error: No se encontró el archivo ${dataPath}`);
      process.exit(1);
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data: ICD10Code[] = JSON.parse(rawData);

    console.log(`✅ Dataset cargado: ${data.length} códigos CIE-10\n`);

    // 3. Verificar si ya hay datos (modo de actualización)
    const { data: existingCodes, error: countError } = await supabase
      .from('icd10_codes')
      .select('code', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error al verificar códigos existentes:', countError.message);
      process.exit(1);
    }

    const existingCount = existingCodes ? existingCodes.length : 0;

    if (existingCount > 0) {
      console.log(`⚠️  Ya existen ${existingCount} códigos en la base de datos`);
      console.log('   Modo: UPSERT (actualizar o insertar)\n');
    }

    // 4. Insertar/actualizar en lotes de 100 (optimizado para Supabase)
    const batchSize = 100;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    console.log('📤 Iniciando inserción en lotes...\n');

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(data.length / batchSize);

      process.stdout.write(
        `   Procesando lote ${batchNumber}/${totalBatches} (${batch.length} códigos)...`
      );

      const { data: upsertedData, error } = await supabase
        .from('icd10_codes')
        .upsert(batch, {
          onConflict: 'code', // Usa el campo 'code' para detectar duplicados
          ignoreDuplicates: false, // Actualiza si existe
        })
        .select('code');

      if (error) {
        console.error(`\n❌ Error en lote ${batchNumber}:`, error.message);
        errors += batch.length;
      } else {
        const count = upsertedData ? upsertedData.length : batch.length;
        inserted += count;
        console.log(` ✅ ${count} códigos procesados`);
      }

      // Pequeño delay para no saturar la API de Supabase
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 5. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL SEED');
    console.log('='.repeat(60));
    console.log(`✅ Códigos procesados exitosamente: ${inserted}`);
    if (errors > 0) {
      console.log(`❌ Códigos con errores: ${errors}`);
    }

    // 6. Verificar conteo final
    const { count: finalCount } = await supabase
      .from('icd10_codes')
      .select('*', { count: 'exact', head: true });

    console.log(`📈 Total de códigos en la base de datos: ${finalCount}`);
    console.log('='.repeat(60));

    // 7. Mostrar algunos ejemplos de búsqueda
    console.log('\n🔍 Probando búsquedas de ejemplo...\n');

    const testQueries = [
      { query: 'I10', description: 'Búsqueda por código exacto' },
      { query: 'diabetes', description: 'Búsqueda por texto' },
      { query: 'hipertension', description: 'Búsqueda sin acentos' },
    ];

    for (const test of testQueries) {
      const { data: results, error } = await supabase
        .from('icd10_codes')
        .select('code, description')
        .or(`code.ilike.%${test.query}%,description.ilike.%${test.query}%`)
        .limit(3);

      if (error) {
        console.log(`   ❌ "${test.query}" (${test.description}): Error`);
      } else {
        console.log(`   ✅ "${test.query}" (${test.description}): ${results?.length || 0} resultados`);
        results?.forEach((r) => console.log(`      - ${r.code}: ${r.description}`));
      }
    }

    console.log('\n✅ Seed completado exitosamente!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error fatal durante el seed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar seed
seedICD10().catch((error) => {
  console.error('❌ Error no capturado:', error);
  process.exit(1);
});
