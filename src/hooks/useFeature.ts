/**
 * useFeature Hook (TASK-BE-007)
 *
 * Hook de React para verificar feature access en el frontend.
 * Permite mostrar/ocultar UI basada en el plan del tenant.
 *
 * @example
 * // Verificar una feature
 * const { hasFeature, isLoading } = useFeature('medical_records');
 *
 * // Verificar múltiples features
 * const { features, isLoading } = useFeatures(['medical_records', 'ai_suggestions']);
 *
 * // Obtener info del plan
 * const { plan, features } = useTenantPlan();
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FeatureKey, PlanKey, PLAN_FEATURES } from '@/constants/pricing';

interface FeatureState {
  hasFeature: boolean;
  isLoading: boolean;
  error: string | null;
  requiredPlan: PlanKey | null;
}

interface FeaturesState {
  features: Record<FeatureKey, boolean>;
  isLoading: boolean;
  error: string | null;
}

interface TenantPlanState {
  plan: PlanKey;
  status: string;
  features: Record<FeatureKey, boolean | number | null>;
  isLoading: boolean;
  error: string | null;
}

interface LimitState {
  allowed: boolean;
  limit: number | null;
  current: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook para verificar si el tenant tiene acceso a una feature
 *
 * @param feature - Feature a verificar
 * @returns Estado de la feature (hasFeature, isLoading, error, requiredPlan)
 */
export function useFeature(feature: FeatureKey): FeatureState {
  const [state, setState] = useState<FeatureState>({
    hasFeature: false,
    isLoading: true,
    error: null,
    requiredPlan: null,
  });

  useEffect(() => {
    let mounted = true;

    async function checkFeature() {
      try {
        const response = await fetch(`/api/features/check?feature=${feature}`, {
          credentials: 'include',
        });

        if (!mounted) return;

        if (!response.ok) {
          const data = await response.json();
          setState({
            hasFeature: false,
            isLoading: false,
            error: data.error || 'Failed to check feature',
            requiredPlan: data.requiredPlan || null,
          });
          return;
        }

        const data = await response.json();
        setState({
          hasFeature: data.hasFeature,
          isLoading: false,
          error: null,
          requiredPlan: data.hasFeature ? null : data.requiredPlan,
        });
      } catch (error) {
        if (!mounted) return;
        setState({
          hasFeature: false,
          isLoading: false,
          error: 'Failed to check feature',
          requiredPlan: null,
        });
      }
    }

    checkFeature();

    return () => {
      mounted = false;
    };
  }, [feature]);

  return state;
}

/**
 * Hook para verificar múltiples features a la vez
 *
 * @param featureList - Array de features a verificar
 * @returns Estado de las features
 */
export function useFeatures(featureList: FeatureKey[]): FeaturesState {
  const [state, setState] = useState<FeaturesState>({
    features: {} as Record<FeatureKey, boolean>,
    isLoading: true,
    error: null,
  });

  const featuresKey = useMemo(() => featureList.sort().join(','), [featureList]);

  useEffect(() => {
    let mounted = true;

    async function checkFeatures() {
      try {
        const response = await fetch(
          `/api/features/check?features=${featuresKey}`,
          { credentials: 'include' }
        );

        if (!mounted) return;

        if (!response.ok) {
          const data = await response.json();
          setState({
            features: {} as Record<FeatureKey, boolean>,
            isLoading: false,
            error: data.error || 'Failed to check features',
          });
          return;
        }

        const data = await response.json();
        setState({
          features: data.features,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (!mounted) return;
        setState({
          features: {} as Record<FeatureKey, boolean>,
          isLoading: false,
          error: 'Failed to check features',
        });
      }
    }

    checkFeatures();

    return () => {
      mounted = false;
    };
  }, [featuresKey]);

  return state;
}

/**
 * Hook para obtener información del plan del tenant
 *
 * @returns Estado del plan del tenant
 */
export function useTenantPlan(): TenantPlanState {
  const [state, setState] = useState<TenantPlanState>({
    plan: 'free',
    status: 'active',
    features: PLAN_FEATURES.free,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchPlan() {
      try {
        const response = await fetch('/api/features/plan', {
          credentials: 'include',
        });

        if (!mounted) return;

        if (!response.ok) {
          const data = await response.json();
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: data.error || 'Failed to fetch plan',
          }));
          return;
        }

        const data = await response.json();
        setState({
          plan: data.plan_key,
          status: data.status,
          features: data.features,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (!mounted) return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to fetch plan',
        }));
      }
    }

    fetchPlan();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

/**
 * Hook para verificar límites cuantitativos
 *
 * @param limitKey - Límite a verificar
 * @param currentCount - Count actual (opcional, si no se provee se obtiene del API)
 * @returns Estado del límite
 */
export function useLimit(
  limitKey: 'max_professionals' | 'max_appointments_per_month' | 'max_patients',
  currentCount?: number
): LimitState {
  const [state, setState] = useState<LimitState>({
    allowed: true,
    limit: null,
    current: currentCount || 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function checkLimit() {
      try {
        const url = currentCount !== undefined
          ? `/api/features/limit?key=${limitKey}&current=${currentCount}`
          : `/api/features/limit?key=${limitKey}`;

        const response = await fetch(url, { credentials: 'include' });

        if (!mounted) return;

        if (!response.ok) {
          const data = await response.json();
          setState({
            allowed: false,
            limit: 0,
            current: currentCount || 0,
            isLoading: false,
            error: data.error || 'Failed to check limit',
          });
          return;
        }

        const data = await response.json();
        setState({
          allowed: data.allowed,
          limit: data.limit,
          current: data.current,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (!mounted) return;
        setState({
          allowed: false,
          limit: 0,
          current: currentCount || 0,
          isLoading: false,
          error: 'Failed to check limit',
        });
      }
    }

    checkLimit();

    return () => {
      mounted = false;
    };
  }, [limitKey, currentCount]);

  return state;
}

/**
 * Hook para obtener el plan mínimo requerido para una feature
 * (versión estática, no requiere API call)
 *
 * @param feature - Feature a verificar
 * @returns Plan mínimo requerido
 */
export function useRequiredPlan(feature: FeatureKey): PlanKey {
  return useMemo(() => {
    const plans: PlanKey[] = ['free', 'care', 'pro', 'enterprise'];

    for (const plan of plans) {
      if (PLAN_FEATURES[plan][feature]) {
        return plan;
      }
    }

    return 'enterprise';
  }, [feature]);
}

/**
 * Componente wrapper que solo renderiza children si el tenant tiene la feature
 *
 * @example
 * <FeatureGate feature="medical_records" fallback={<UpgradePrompt />}>
 *   <MedicalRecordsComponent />
 * </FeatureGate>
 */
interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

export function FeatureGateComponent({
  feature,
  children,
  fallback = null,
  loadingFallback = null,
}: FeatureGateProps): React.ReactNode {
  const { hasFeature, isLoading } = useFeature(feature);

  if (isLoading) {
    return loadingFallback;
  }

  if (!hasFeature) {
    return fallback;
  }

  return children;
}

// Re-export types for convenience
export type { FeatureKey, PlanKey };
