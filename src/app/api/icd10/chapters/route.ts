/**
 * API Route: GET /api/icd10/chapters
 *
 * Obtiene la lista de capítulos CIE-10 disponibles
 *
 * TASK: TASK-BE-041
 * Epic: EPIC-004 (Historias Clínicas Inteligentes)
 *
 * Respuesta:
 * {
 *   chapters: [
 *     {
 *       code: "I00-I99",
 *       name: "Enfermedades del sistema circulatorio",
 *       count: 150
 *     },
 *     ...
 *   ]
 * }
 *
 * Los capítulos se ordenan alfabéticamente por código.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener capítulos únicos con conteo de códigos
    const { data, error } = await supabase
      .from('icd10_codes')
      .select('chapter_code, chapter_name')
      .not('chapter_code', 'is', null)
      .order('chapter_code');

    if (error) {
      console.error('[ICD10 Chapters] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch chapters', details: error.message },
        { status: 500 }
      );
    }

    // Agrupar por capítulo y contar códigos
    const chaptersMap = new Map<
      string,
      { code: string; name: string; count: number }
    >();

    for (const row of data || []) {
      const key = row.chapter_code;
      if (key) {
        if (chaptersMap.has(key)) {
          const chapter = chaptersMap.get(key)!;
          chapter.count += 1;
        } else {
          chaptersMap.set(key, {
            code: row.chapter_code,
            name: row.chapter_name,
            count: 1,
          });
        }
      }
    }

    // Convertir a array
    const chapters = Array.from(chaptersMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    );

    return NextResponse.json(
      {
        chapters,
        total: chapters.length,
      },
      {
        headers: {
          // Cache agresivo (capítulos no cambian frecuentemente)
          'Cache-Control':
            'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error: any) {
    console.error('[ICD10 Chapters] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
