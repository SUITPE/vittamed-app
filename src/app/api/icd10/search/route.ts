/**
 * API Route: GET /api/icd10/search
 *
 * Búsqueda de códigos CIE-10 para historias clínicas inteligentes
 *
 * TASK: TASK-BE-041
 * Epic: EPIC-004 (Historias Clínicas Inteligentes)
 *
 * Query params:
 * - q: string (required) - Query de búsqueda (min 2 caracteres)
 * - limit: number (optional) - Cantidad máxima de resultados (default: 10, max: 50)
 * - chapter: string (optional) - Filtrar por código de capítulo (ej: "I00-I99")
 *
 * Ejemplos:
 * GET /api/icd10/search?q=hipertension
 * GET /api/icd10/search?q=I10
 * GET /api/icd10/search?q=diabetes&limit=5
 * GET /api/icd10/search?q=dolor&chapter=M00-M99
 *
 * Respuesta:
 * {
 *   results: [
 *     {
 *       code: "I10",
 *       description: "Hipertensión esencial (primaria)",
 *       category: "I10-I15 Enfermedades hipertensivas",
 *       chapter_name: "Enfermedades del sistema circulatorio"
 *     }
 *   ],
 *   count: 1,
 *   query: "hipertension"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limitParam = searchParams.get('limit');
    const chapterCode = searchParams.get('chapter');

    // Validación de parámetros
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters', field: 'q' },
        { status: 400 }
      );
    }

    const limit = Math.min(Math.max(parseInt(limitParam || '10'), 1), 50);

    // Crear cliente de Supabase
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Construir query de búsqueda
    let dbQuery = supabase
      .from('icd10_codes')
      .select('code, description, category, chapter_name, chapter_code');

    // Filtro por capítulo (opcional)
    if (chapterCode) {
      dbQuery = dbQuery.eq('chapter_code', chapterCode);
    }

    // Búsqueda: combina varias estrategias
    // 1. Coincidencia exacta de código (case insensitive)
    // 2. Código que empieza con el query
    // 3. Descripción que contiene el query
    // 4. Sinónimos que contienen el query

    const searchQuery = query.toLowerCase().trim();

    // Usar operador OR para buscar en múltiples campos
    const { data, error } = await dbQuery
      .or(
        `code.ilike.${searchQuery}%,` + // Código que empieza con query
          `code.ilike.%${searchQuery}%,` + // Código que contiene query
          `description.ilike.%${searchQuery}%,` + // Descripción contiene query
          `search_terms.cs.{${searchQuery}}` // Sinónimos contienen query
      )
      .order('usage_count', { ascending: false }) // Ordenar por popularidad primero
      .limit(limit * 2); // Obtener más resultados para luego ordenar por relevancia

    if (error) {
      console.error('[ICD10 Search] Database error:', error);
      return NextResponse.json(
        { error: 'Search failed', details: error.message },
        { status: 500 }
      );
    }

    // Ordenar resultados por relevancia
    const sortedResults = (data || []).sort((a, b) => {
      const qLower = searchQuery;
      const aCode = a.code.toLowerCase();
      const bCode = b.code.toLowerCase();
      const aDesc = a.description.toLowerCase();
      const bDesc = b.description.toLowerCase();

      // 1. Coincidencia exacta de código (mayor prioridad)
      if (aCode === qLower) return -1;
      if (bCode === qLower) return 1;

      // 2. Código empieza con query
      if (aCode.startsWith(qLower) && !bCode.startsWith(qLower)) return -1;
      if (bCode.startsWith(qLower) && !aCode.startsWith(qLower)) return 1;

      // 3. Descripción empieza con query
      if (aDesc.startsWith(qLower) && !bDesc.startsWith(qLower)) return -1;
      if (bDesc.startsWith(qLower) && !aDesc.startsWith(qLower)) return 1;

      // 4. Descripción contiene query al inicio de una palabra
      const aWordStart = new RegExp(`\\b${qLower}`, 'i').test(aDesc);
      const bWordStart = new RegExp(`\\b${qLower}`, 'i').test(bDesc);
      if (aWordStart && !bWordStart) return -1;
      if (bWordStart && !aWordStart) return 1;

      // 5. Por defecto, mantener orden por usage_count (ya ordenado en DB)
      return 0;
    });

    // Limitar resultados finales
    const finalResults = sortedResults.slice(0, limit);

    // Calcular tiempo de respuesta
    const responseTime = Date.now() - startTime;

    // Log para monitoring (opcional)
    if (responseTime > 200) {
      console.warn(`[ICD10 Search] Slow query: ${responseTime}ms for "${query}"`);
    }

    return NextResponse.json(
      {
        results: finalResults,
        count: finalResults.length,
        query: query,
        responseTime: responseTime,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error: any) {
    console.error('[ICD10 Search] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/icd10/search/increment
 *
 * Incrementa el contador de uso de un código CIE-10
 * (llamar cuando el usuario selecciona un código)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Llamar función de base de datos para incrementar contador
    const { error } = await supabase.rpc('increment_icd10_usage', {
      code_param: code,
    });

    if (error) {
      console.error('[ICD10 Search] Error incrementing usage:', error);
      return NextResponse.json(
        { error: 'Failed to increment usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ICD10 Search] Unexpected error in POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
