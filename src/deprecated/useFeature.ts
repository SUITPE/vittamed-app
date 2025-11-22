/**
 * useFeature - Hook para validar acceso a features según plan de suscripción
 *
 * Este hook funciona junto con el sistema de feature gating del backend
 * para validar si el tenant actual tiene acceso a una feature específica.
 *
 * @example
 * const { hasAccess, isLoading, requiredPlan } = useFeature('medical_records')
 *
 * if (!hasAccess) {
 *   return <UpgradePrompt feature="Historias Clínicas" requiredPlan={requiredPlan} />
 * }
 */

'use client'

import { useState, useEffect } from 'react'
import { FeatureKey, PlanKey } from '@/constants/pricing'

interface UseFeatureResult {
  hasAccess: boolean
  isLoading: boolean
  requiredPlan: PlanKey | null
  error: string | null
}

export function useFeature(feature: FeatureKey): UseFeatureResult {
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [requiredPlan, setRequiredPlan] = useState<PlanKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkFeature() {
      try {
        const response = await fetch('/api/features/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feature }),
        })

        if (!response.ok) {
          throw new Error('Failed to check feature access')
        }

        const data = await response.json()

        setHasAccess(data.has_access)
        setRequiredPlan(data.required_plan)
        setError(null)
      } catch (err) {
        console.error('[useFeature] Error checking feature:', err)
        setHasAccess(false)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    checkFeature()
  }, [feature])

  return { hasAccess, isLoading, requiredPlan, error }
}

/**
 * useTenantFeatures - Hook para obtener todas las features del tenant actual
 *
 * Retorna un objeto con todas las features y sus valores (true/false)
 * según el plan de suscripción del tenant.
 *
 * @example
 * const { features, isLoading } = useTenantFeatures()
 *
 * if (features?.medical_records) {
 *   // Mostrar opción de historias clínicas
 * }
 */

interface UseTenantFeaturesResult {
  features: Record<FeatureKey, boolean> | null
  isLoading: boolean
  error: string | null
  currentPlan: PlanKey | null
}

export function useTenantFeatures(): UseTenantFeaturesResult {
  const [features, setFeatures] = useState<Record<FeatureKey, boolean> | null>(
    null
  )
  const [currentPlan, setCurrentPlan] = useState<PlanKey | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeatures() {
      try {
        const response = await fetch('/api/features/list')

        if (!response.ok) {
          throw new Error('Failed to fetch tenant features')
        }

        const data = await response.json()

        setFeatures(data.features)
        setCurrentPlan(data.current_plan)
        setError(null)
      } catch (err) {
        console.error('[useTenantFeatures] Error fetching features:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeatures()
  }, [])

  return { features, isLoading, error, currentPlan }
}
