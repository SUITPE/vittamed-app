/**
 * API Route: GET /api/features/limit
 *
 * Verifica límites cuantitativos del plan del tenant.
 *
 * Query params:
 * - key: Límite a verificar (max_professionals, max_patients, max_appointments_per_month)
 * - current: Count actual (opcional - si no se provee, se calcula automáticamente)
 *
 * Response:
 * {
 *   allowed: boolean,
 *   limit: number | null (null = ilimitado),
 *   current: number
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeatureGate } from '@/lib/feature-gating';
import { createClient } from '@/lib/supabase-server';

type LimitKey = 'max_professionals' | 'max_appointments_per_month' | 'max_patients';

export async function GET(request: NextRequest) {
  try {
    // 1. Obtener usuario autenticado
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. Obtener tenant_id del usuario
    const { data: profile } = await supabase
      .from('custom_users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const tenantId = profile.tenant_id;

    // 3. Parsear query params
    const url = new URL(request.url);
    const limitKey = url.searchParams.get('key') as LimitKey | null;
    const providedCurrent = url.searchParams.get('current');

    if (!limitKey) {
      return NextResponse.json(
        { error: 'Missing limit key parameter', code: 'INVALID_PARAMS' },
        { status: 400 }
      );
    }

    // Validar limit key
    const validKeys: LimitKey[] = ['max_professionals', 'max_patients', 'max_appointments_per_month'];
    if (!validKeys.includes(limitKey)) {
      return NextResponse.json(
        { error: 'Invalid limit key', code: 'INVALID_PARAMS' },
        { status: 400 }
      );
    }

    // 4. Obtener count actual
    let currentCount: number;

    if (providedCurrent !== null) {
      currentCount = parseInt(providedCurrent, 10);
    } else {
      // Calcular automáticamente basado en el tipo de límite
      currentCount = await getCurrentCount(supabase, tenantId, limitKey);
    }

    // 5. Verificar límite
    const result = await FeatureGate.checkLimit(tenantId, limitKey, currentCount);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[/api/features/limit] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Calcula el count actual para un tipo de límite
 */
async function getCurrentCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  limitKey: LimitKey
): Promise<number> {
  switch (limitKey) {
    case 'max_professionals': {
      const { count } = await supabase
        .from('custom_users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('role', ['doctor', 'admin_tenant', 'staff']);
      return count || 0;
    }

    case 'max_patients': {
      const { count } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);
      return count || 0;
    }

    case 'max_appointments_per_month': {
      // Contar citas del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('appointment_date', startOfMonth)
        .lte('appointment_date', endOfMonth);
      return count || 0;
    }

    default:
      return 0;
  }
}
