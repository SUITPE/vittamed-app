/**
 * Feature Gating Middleware (TASK-BE-007)
 *
 * Higher-order function para proteger API routes según el plan del tenant.
 * Verifica que el tenant tenga acceso a la feature antes de ejecutar el handler.
 *
 * @example
 * // En una API route
 * import { withFeature } from '@/middleware/withFeature';
 *
 * async function handler(request: NextRequest) {
 *   // Tu lógica aquí - solo se ejecuta si el tenant tiene la feature
 *   return NextResponse.json({ data: 'success' });
 * }
 *
 * export const POST = withFeature('medical_records', handler);
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeatureGate } from '@/lib/feature-gating';
import { FeatureKey, PlanKey } from '@/constants/pricing';
import { createClient } from '@/lib/supabase-server';

type RouteHandler = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>;

interface WithFeatureOptions {
  /** Si es true, devuelve un JSON con error. Si es false, redirige a /pricing */
  jsonResponse?: boolean;
  /** Mensaje de error personalizado */
  errorMessage?: string;
  /** Función para extraer tenantId del request (por defecto busca en headers o body) */
  getTenantId?: (request: NextRequest) => Promise<string | null>;
}

/**
 * HOF que protege una API route verificando feature access
 *
 * @param feature - Feature requerida (ej: 'medical_records', 'ai_suggestions')
 * @param handler - Handler de la API route
 * @param options - Opciones adicionales
 * @returns Handler protegido
 */
export function withFeature(
  feature: FeatureKey,
  handler: RouteHandler,
  options: WithFeatureOptions = {}
): RouteHandler {
  const {
    jsonResponse = true,
    errorMessage,
    getTenantId: customGetTenantId,
  } = options;

  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      // 1. Obtener tenant ID
      const tenantId = customGetTenantId
        ? await customGetTenantId(request)
        : await getDefaultTenantId(request);

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
          { status: 401 }
        );
      }

      // 2. Verificar feature access
      const hasAccess = await FeatureGate.hasFeature(tenantId, feature);

      if (!hasAccess) {
        const requiredPlan = FeatureGate.getRequiredPlan(feature);
        const message =
          errorMessage ||
          `This feature requires the ${requiredPlan.toUpperCase()} plan or higher`;

        if (jsonResponse) {
          return NextResponse.json(
            {
              error: message,
              code: 'FEATURE_NOT_AVAILABLE',
              feature,
              requiredPlan,
              upgradeUrl: '/pricing',
            },
            { status: 403 }
          );
        } else {
          return NextResponse.redirect(new URL('/pricing', request.url));
        }
      }

      // 3. Feature disponible, ejecutar handler
      return handler(request, context);
    } catch (error) {
      console.error('[withFeature] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * HOF para verificar límites cuantitativos
 *
 * @param limitKey - Límite a verificar (max_professionals, max_patients, etc.)
 * @param getCurrentCount - Función que retorna el count actual
 * @param handler - Handler de la API route
 * @returns Handler protegido
 */
export function withLimit(
  limitKey: 'max_professionals' | 'max_appointments_per_month' | 'max_patients',
  getCurrentCount: (tenantId: string) => Promise<number>,
  handler: RouteHandler
): RouteHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      const tenantId = await getDefaultTenantId(request);

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
          { status: 401 }
        );
      }

      const currentCount = await getCurrentCount(tenantId);
      const result = await FeatureGate.checkLimit(tenantId, limitKey, currentCount);

      if (!result.allowed) {
        const limitName = limitKey.replace(/_/g, ' ').replace('max ', '');
        return NextResponse.json(
          {
            error: `You have reached the maximum ${limitName} limit for your plan`,
            code: 'LIMIT_REACHED',
            limit: result.limit,
            current: result.current,
            upgradeUrl: '/pricing',
          },
          { status: 403 }
        );
      }

      return handler(request, context);
    } catch (error) {
      console.error('[withLimit] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * Combina múltiples features requeridas (AND logic)
 */
export function withFeatures(
  features: FeatureKey[],
  handler: RouteHandler,
  options: WithFeatureOptions = {}
): RouteHandler {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      const tenantId = options.getTenantId
        ? await options.getTenantId(request)
        : await getDefaultTenantId(request);

      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
          { status: 401 }
        );
      }

      // Verificar todas las features
      const missingFeatures: { feature: FeatureKey; requiredPlan: PlanKey }[] = [];

      for (const feature of features) {
        const hasAccess = await FeatureGate.hasFeature(tenantId, feature);
        if (!hasAccess) {
          missingFeatures.push({
            feature,
            requiredPlan: FeatureGate.getRequiredPlan(feature),
          });
        }
      }

      if (missingFeatures.length > 0) {
        // Determinar el plan más alto requerido
        const planOrder: PlanKey[] = ['free', 'care', 'pro', 'enterprise'];
        const highestPlan = missingFeatures.reduce((highest, current) => {
          const currentIndex = planOrder.indexOf(current.requiredPlan);
          const highestIndex = planOrder.indexOf(highest);
          return currentIndex > highestIndex ? current.requiredPlan : highest;
        }, 'free' as PlanKey);

        return NextResponse.json(
          {
            error: `This action requires the ${highestPlan.toUpperCase()} plan or higher`,
            code: 'FEATURES_NOT_AVAILABLE',
            missingFeatures,
            requiredPlan: highestPlan,
            upgradeUrl: '/pricing',
          },
          { status: 403 }
        );
      }

      return handler(request, context);
    } catch (error) {
      console.error('[withFeatures] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * Función por defecto para obtener tenantId del request
 */
async function getDefaultTenantId(request: NextRequest): Promise<string | null> {
  // 1. Intentar obtener de headers
  const headerTenantId = request.headers.get('x-tenant-id');
  if (headerTenantId) return headerTenantId;

  // 2. Intentar obtener del usuario autenticado
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Buscar tenant del usuario
      const { data: profile } = await supabase
        .from('custom_users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profile?.tenant_id) {
        return profile.tenant_id;
      }
    }
  } catch (error) {
    console.error('[getDefaultTenantId] Error getting user tenant:', error);
  }

  // 3. Intentar obtener de query params
  const url = new URL(request.url);
  const queryTenantId = url.searchParams.get('tenantId');
  if (queryTenantId) return queryTenantId;

  // 4. Intentar obtener del path (ej: /api/tenants/[tenantId]/...)
  const pathMatch = request.nextUrl.pathname.match(/\/tenants\/([^/]+)/);
  if (pathMatch) return pathMatch[1];

  return null;
}
