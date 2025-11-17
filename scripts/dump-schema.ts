/**
 * Script para extraer el schema completo desde Supabase Development
 * Genera un archivo SQL con todas las tablas, vistas, funciones, triggers y RLS policies
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Credenciales de Development (base de datos actual)
const SUPABASE_URL = 'https://mvvxeqhsatkqtsrulcil.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzc5NDU2OCwiZXhwIjoyMDQzMzcwNTY4fQ.gGbBW3oMOr88xNkJ4_N2xv4YVlMOHC3bVQrQzl22F2A'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function extractSchema() {
  console.log('🔍 Extrayendo schema desde base de datos de desarrollo...')

  try {
    // Query para obtener información de todas las tablas
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', '%migration%')

    if (error) {
      console.error('❌ Error al obtener tablas:', error)
      return
    }

    console.log(`✅ Encontradas ${tables?.length || 0} tablas`)
    console.log('Tablas:', tables?.map(t => t.table_name).join(', '))

    // Nota: Supabase no expone pg_dump directamente vía API
    // Necesitaremos usar otra estrategia

  } catch (err) {
    console.error('❌ Error:', err)
  }
}

extractSchema()
