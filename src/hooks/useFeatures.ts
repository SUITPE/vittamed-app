import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { FeatureKey, FeatureWithStatus } from '@/types/features'

interface UseFeaturesResult {
  features: FeatureWithStatus[]
  loading: boolean
  error: string | null
  hasFeature: (featureKey: FeatureKey) => boolean
  isFeatureEnabled: (featureKey: FeatureKey) => boolean
  toggleFeature: (featureKey: FeatureKey, enabled: boolean, notes?: string) => Promise<boolean>
  refetch: () => Promise<void>
}

/**
 * Hook to manage feature flags for a tenant
 *
 * Usage:
 * const { hasFeature, isFeatureEnabled } = useFeatures()
 *
 * if (hasFeature('patient_management')) {
 *   // Show patient management UI
 * }
 */
export function useFeatures(): UseFeaturesResult {
  const { user } = useAuth()
  const [features, setFeatures] = useState<FeatureWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tenantId = user?.profile?.tenant_id

  const fetchFeatures = async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/tenants/${tenantId}/features`)

      if (!response.ok) {
        throw new Error('Failed to fetch features')
      }

      const data = await response.json()
      setFeatures(data.features || [])
    } catch (err) {
      console.error('Error fetching features:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeatures()
  }, [tenantId])

  /**
   * Check if a feature is available in the tenant's plan
   */
  const hasFeature = (featureKey: FeatureKey): boolean => {
    const feature = features.find(f => f.feature_key === featureKey)
    return feature?.is_available_in_plan || false
  }

  /**
   * Check if a feature is currently enabled for the tenant
   */
  const isFeatureEnabled = (featureKey: FeatureKey): boolean => {
    const feature = features.find(f => f.feature_key === featureKey)
    return feature?.is_enabled || false
  }

  /**
   * Toggle a feature on/off for the tenant
   */
  const toggleFeature = async (
    featureKey: FeatureKey,
    enabled: boolean,
    notes?: string
  ): Promise<boolean> => {
    if (!tenantId) {
      console.error('No tenant ID available')
      return false
    }

    try {
      const response = await fetch(`/api/tenants/${tenantId}/features`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature_key: featureKey,
          is_enabled: enabled,
          notes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle feature')
      }

      // Refetch features to get updated state
      await fetchFeatures()
      return true
    } catch (err) {
      console.error('Error toggling feature:', err)
      return false
    }
  }

  return {
    features,
    loading,
    error,
    hasFeature,
    isFeatureEnabled,
    toggleFeature,
    refetch: fetchFeatures
  }
}

/**
 * Simple hook to check if a specific feature is enabled
 *
 * Usage:
 * const canManagePatients = useFeatureFlag('patient_management')
 */
export function useFeatureFlag(featureKey: FeatureKey): boolean {
  const { isFeatureEnabled } = useFeatures()
  return isFeatureEnabled(featureKey)
}
