/**
 * Feature Gating System (TASK-BE-007)
 *
 * Sistema de control de acceso a features según el plan de suscripción
 * del tenant. Valida tanto features booleanas como límites cuantitativos.
 *
 * Uso:
 * - Backend: FeatureGate.hasFeature() en API routes
 * - Frontend: useFeature() hook (ver src/hooks/useFeature.ts)
 */

import { PLAN_FEATURES, PlanKey, FeatureKey } from '@/constants/pricing';
import { createClient } from '@/lib/supabase-server';

export class FeatureGate {
  /**
   * Verifica si un tenant tiene acceso a una feature
   *
   * @param tenantId - ID del tenant
   * @param feature - Feature a verificar (ej: 'medical_records', 'ai_suggestions')
   * @returns true si el tenant tiene acceso a la feature
   *
   * @example
   * const hasAccess = await FeatureGate.hasFeature(tenantId, 'medical_records');
   * if (!hasAccess) {
   *   return NextResponse.json({ error: 'Feature not available' }, { status: 403 });
   * }
   */
  static async hasFeature(
    tenantId: string,
    feature: FeatureKey
  ): Promise<boolean> {
    try {
      const supabase = await createClient();

      // Obtener plan del tenant
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('subscription_plan_key, subscription_status')
        .eq('id', tenantId)
        .single();

      if (error || !tenant) {
        console.error('[FeatureGate] Tenant not found:', tenantId);
        return false;
      }

      // Si la suscripción está inactiva o expirada, downgrade a Free
      const planKey: PlanKey =
        tenant.subscription_status === 'active'
          ? (tenant.subscription_plan_key as PlanKey) || 'free'
          : 'free';

      const planFeatures = PLAN_FEATURES[planKey];

      if (!planFeatures) {
        console.error('[FeatureGate] Invalid plan key:', planKey);
        return false;
      }

      return !!planFeatures[feature];
    } catch (error) {
      console.error('[FeatureGate] Error checking feature:', error);
      return false;
    }
  }

  /**
   * Verifica límites cuantitativos (ej: número de profesionales)
   *
   * @param tenantId - ID del tenant
   * @param limitKey - Límite a verificar (max_professionals, max_patients, etc.)
   * @param currentCount - Cantidad actual
   * @returns Objeto con allowed, limit y current
   *
   * @example
   * const result = await FeatureGate.checkLimit(tenantId, 'max_professionals', 5);
   * if (!result.allowed) {
   *   return NextResponse.json({
   *     error: `Maximum professionals limit reached (${result.limit})`
   *   }, { status: 403 });
   * }
   */
  static async checkLimit(
    tenantId: string,
    limitKey: 'max_professionals' | 'max_appointments_per_month' | 'max_patients',
    currentCount: number
  ): Promise<{ allowed: boolean; limit: number | null; current: number }> {
    try {
      const supabase = await createClient();

      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('subscription_plan_key, subscription_status')
        .eq('id', tenantId)
        .single();

      if (error || !tenant) {
        console.error('[FeatureGate] Tenant not found:', tenantId);
        return { allowed: false, limit: 0, current: currentCount };
      }

      const planKey: PlanKey =
        tenant.subscription_status === 'active'
          ? (tenant.subscription_plan_key as PlanKey) || 'free'
          : 'free';

      const planFeatures = PLAN_FEATURES[planKey];

      if (!planFeatures) {
        return { allowed: false, limit: 0, current: currentCount };
      }

      const limitValue = planFeatures[limitKey];

      // null = ilimitado
      if (limitValue === null) {
        return { allowed: true, limit: null, current: currentCount };
      }

      // Ensure we have a number (limitKey should always return number for these keys)
      const limit = typeof limitValue === 'number' ? limitValue : 0;

      return {
        allowed: currentCount < limit,
        limit,
        current: currentCount,
      };
    } catch (error) {
      console.error('[FeatureGate] Error checking limit:', error);
      return { allowed: false, limit: 0, current: currentCount };
    }
  }

  /**
   * Obtiene el plan mínimo requerido para una feature
   *
   * @param feature - Feature a verificar
   * @returns Plan mínimo requerido ('free', 'care', 'pro', 'enterprise')
   *
   * @example
   * const requiredPlan = FeatureGate.getRequiredPlan('medical_records');
   * console.log(`Upgrade to ${requiredPlan} to unlock this feature`);
   */
  static getRequiredPlan(feature: FeatureKey): PlanKey {
    const plans: PlanKey[] = ['free', 'care', 'pro', 'enterprise'];

    for (const plan of plans) {
      if (PLAN_FEATURES[plan][feature]) {
        return plan;
      }
    }

    return 'enterprise'; // Default: enterprise si no está en ningún plan
  }

  /**
   * Obtiene todas las features del plan actual del tenant
   *
   * @param tenantId - ID del tenant
   * @returns Objeto con todas las features y sus valores
   *
   * @example
   * const features = await FeatureGate.getTenantFeatures(tenantId);
   * console.log(features.medical_records); // true o false
   */
  static async getTenantFeatures(
    tenantId: string
  ): Promise<Record<FeatureKey, boolean | number | null>> {
    try {
      const supabase = await createClient();

      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('subscription_plan_key, subscription_status')
        .eq('id', tenantId)
        .single();

      if (error || !tenant) {
        console.error('[FeatureGate] Tenant not found:', tenantId);
        return PLAN_FEATURES.free as any;
      }

      const planKey: PlanKey =
        tenant.subscription_status === 'active'
          ? (tenant.subscription_plan_key as PlanKey) || 'free'
          : 'free';

      return PLAN_FEATURES[planKey] as any;
    } catch (error) {
      console.error('[FeatureGate] Error getting tenant features:', error);
      return PLAN_FEATURES.free as any;
    }
  }

  /**
   * Obtiene información del plan del tenant
   *
   * @param tenantId - ID del tenant
   * @returns Información del plan (plan_key, status, features)
   */
  static async getTenantPlan(tenantId: string): Promise<{
    plan_key: PlanKey;
    status: string;
    features: Record<FeatureKey, boolean | number | null>;
  }> {
    try {
      const supabase = await createClient();

      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('subscription_plan_key, subscription_status')
        .eq('id', tenantId)
        .single();

      if (error || !tenant) {
        return {
          plan_key: 'free',
          status: 'active',
          features: PLAN_FEATURES.free as any,
        };
      }

      const planKey: PlanKey =
        tenant.subscription_status === 'active'
          ? (tenant.subscription_plan_key as PlanKey) || 'free'
          : 'free';

      return {
        plan_key: planKey,
        status: tenant.subscription_status || 'active',
        features: PLAN_FEATURES[planKey] as any,
      };
    } catch (error) {
      console.error('[FeatureGate] Error getting tenant plan:', error);
      return {
        plan_key: 'free',
        status: 'active',
        features: PLAN_FEATURES.free as any,
      };
    }
  }
}
