/**
 * withFeature Middleware (TASK-BE-007)
 *
 * Higher-order function para proteger API routes por feature
 * Valida que el tenant tenga acceso a una feature antes de ejecutar el handler
 *
 * Uso:
 * export const POST = withFeature('medical_records')(handler);
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeatureGate } from '@/lib/feature-gating';
import { FeatureKey } from '@/constants/pricing';
import { createClient } from '@/lib/supabase-server';

/**
 * Extrae tenant_id de la request
 * Intenta obtenerlo de:
 * 1. Query params (?tenant_id=xxx)
 * 2. User profile (via Supabase Auth)
 *
 * @param request - NextRequest
 * @returns tenant_id o null
 */
async function getTenantIdFromRequest(request: NextRequest): Promise<string | null> {
  try {
    // Opción 1: Desde query params (útil para testing)
    const url = new URL(request.url);
    const tenantIdFromQuery = url.searchParams.get('tenant_id');
    if (tenantIdFromQuery) {
      return tenantIdFromQuery;
    }

    // Opción 2: Desde user profile
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Obtener tenant_id del perfil del usuario
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    return profile?.tenant_id || null;
  } catch (error) {
    console.error('[withFeature] Error getting tenant_id:', error);
    return null;
  }
}

/**
 * Higher-order function para proteger API routes por feature
 *
 * @param feature - Feature requerida para acceder al endpoint
 * @returns Middleware function
 *
 * @example
 * // Proteger endpoint de historias clínicas
 * async function handler(request: NextRequest) {
 *   // Solo llega aquí si tiene acceso a medical_records
 *   return NextResponse.json({ success: true });
 * }
 *
 * export const POST = withFeature('medical_records')(handler);
 */
export function withFeature(feature: FeatureKey) {
  return function (handler: Function) {
    return async function (request: NextRequest, ...args: any[]) {
      try {
        // 1. Obtener tenant_id del request
        const tenantId = await getTenantIdFromRequest(request);

        if (!tenantId) {
          return NextResponse.json(
            { error: 'Unauthorized: No tenant found' },
            { status: 401 }
          );
        }

        // 2. Verificar feature
        const hasAccess = await FeatureGate.hasFeature(tenantId, feature);

        if (!hasAccess) {
          const requiredPlan = FeatureGate.getRequiredPlan(feature);

          return NextResponse.json(
            {
              error: 'Feature not available in your plan',
              feature,
              required_plan: requiredPlan,
              upgrade_url: '/pricing',
              message: `Upgrade to ${requiredPlan} plan to unlock this feature`,
            },
            { status: 403 }
          );
        }

        // 3. Feature permitida, ejecutar handler
        return handler(request, ...args);
      } catch (error: any) {
        console.error('[withFeature] Error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * Middleware para verificar límites cuantitativos
 *
 * @param limitKey - Tipo de límite a verificar
 * @param getCurrentCount - Función que retorna el conteo actual
 * @returns Middleware function
 *
 * @example
 * export const POST = withLimit(
 *   'max_professionals',
 *   async (tenantId) => {
 *     const { count } = await supabase
 *       .from('professionals')
 *       .select('*', { count: 'exact' })
 *       .eq('tenant_id', tenantId);
 *     return count || 0;
 *   }
 * )(handler);
 */
export function withLimit(
  limitKey: 'max_professionals' | 'max_appointments_per_month' | 'max_patients',
  getCurrentCount: (tenantId: string) => Promise<number>
) {
  return function (handler: Function) {
    return async function (request: NextRequest, ...args: any[]) {
      try {
        // 1. Obtener tenant_id
        const tenantId = await getTenantIdFromRequest(request);

        if (!tenantId) {
          return NextResponse.json(
            { error: 'Unauthorized: No tenant found' },
            { status: 401 }
          );
        }

        // 2. Obtener conteo actual
        const currentCount = await getCurrentCount(tenantId);

        // 3. Verificar límite
        const result = await FeatureGate.checkLimit(tenantId, limitKey, currentCount);

        if (!result.allowed) {
          const requiredPlan = limitKey === 'max_professionals' && result.limit === 1
            ? 'pro' // Pro permite 5 profesionales
            : 'enterprise'; // Enterprise tiene ilimitados

          return NextResponse.json(
            {
              error: `Limit reached for ${limitKey}`,
              limit_key: limitKey,
              current: result.current,
              limit: result.limit,
              required_plan: requiredPlan,
              upgrade_url: '/pricing',
              message: `You've reached the maximum limit (${result.limit}). Upgrade to unlock more.`,
            },
            { status: 403 }
          );
        }

        // 4. Límite OK, ejecutar handler
        return handler(request, ...args);
      } catch (error: any) {
        console.error('[withLimit] Error:', error);
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        );
      }
    };
  };
}
