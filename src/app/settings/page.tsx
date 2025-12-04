'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import { Icons } from '@/components/ui/Icons'
import { useFeatures } from '@/hooks/useFeatures'
import { FEATURE_CONFIG } from '@/types/features'
import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton'
import SettingsClient from '@/components/admin/SettingsClient'
import type { FeatureCategory } from '@/types/features'
import type { BusinessType } from '@/types/business'

interface TenantSettings {
  id: string
  name: string
  tenant_type: BusinessType
  address: string
  phone: string
  email: string
}

type TabType = 'general' | 'features' | 'team' | 'notifications' | 'billing' | 'security'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab') as TabType | null

  const [activeTab, setActiveTab] = useState<TabType>(
    tabFromUrl && ['general', 'features', 'team', 'notifications', 'billing', 'security'].includes(tabFromUrl)
      ? tabFromUrl
      : 'features'
  )
  const { features, loading: featuresLoading, toggleFeature } = useFeatures()
  const [tenantData, setTenantData] = useState<TenantSettings | null>(null)
  const [tenantLoading, setTenantLoading] = useState(false)
  const [tenantFetched, setTenantFetched] = useState(false)

  const currentTenantId = user?.profile?.tenant_id || undefined

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Sync tab from URL
  useEffect(() => {
    if (tabFromUrl && ['general', 'features', 'team', 'notifications', 'billing', 'security'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl])

  // Fetch tenant data when General tab is active (only once)
  useEffect(() => {
    if (activeTab === 'general' && currentTenantId && !tenantFetched && !tenantLoading) {
      setTenantLoading(true)
      setTenantFetched(true)
      fetch(`/api/tenants/${currentTenantId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then(data => {
          if (data && !data.error) {
            setTenantData(data)
          }
        })
        .catch(err => console.error('Error fetching tenant:', err))
        .finally(() => setTenantLoading(false))
    }
  }, [activeTab, currentTenantId, tenantFetched, tenantLoading])

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams.toString())
    if (tab === 'features') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    router.replace(`/settings${params.toString() ? '?' + params.toString() : ''}`, { scroll: false })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar tenantId={currentTenantId} />
        <AdminHeader />
        <div className="md:ml-64 pt-16 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-72" />
            </div>
            {/* Tabs Skeleton */}
            <SkeletonCard className="p-0">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex gap-8">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="h-5 w-24" />
                  ))}
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <SkeletonCard key={i} className="p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </div>
                    </SkeletonCard>
                  ))}
                </div>
              </div>
            </SkeletonCard>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar tenantId={currentTenantId} />
      <AdminHeader />

      <div className="md:ml-64 pt-16">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
              <p className="text-gray-600 mt-1">
                Gestiona tu cuenta, equipo y preferencias
              </p>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => handleTabChange('features')}
                    className={`${
                      activeTab === 'features'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icons.zap className="w-4 h-4" />
                    Funcionalidades
                  </button>
                  <button
                    onClick={() => handleTabChange('general')}
                    className={`${
                      activeTab === 'general'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icons.settings className="w-4 h-4" />
                    General
                  </button>
                  <button
                    onClick={() => handleTabChange('team')}
                    className={`${
                      activeTab === 'team'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icons.users className="w-4 h-4" />
                    Equipo
                  </button>
                  <button
                    onClick={() => handleTabChange('notifications')}
                    className={`${
                      activeTab === 'notifications'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icons.bell className="w-4 h-4" />
                    Notificaciones
                  </button>
                  <button
                    onClick={() => handleTabChange('billing')}
                    className={`${
                      activeTab === 'billing'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icons.creditCard className="w-4 h-4" />
                    Facturación
                  </button>
                  <button
                    onClick={() => handleTabChange('security')}
                    className={`${
                      activeTab === 'security'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <Icons.lock className="w-4 h-4" />
                    Seguridad
                  </button>
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-lg shadow-sm">
              {activeTab === 'features' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Funcionalidades Activas</h2>
                    <p className="text-sm text-gray-600">
                      Gestiona las funcionalidades disponibles para tu negocio
                    </p>
                  </div>

                  {featuresLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <SkeletonCard key={i} className="p-4">
                          <div className="flex items-start gap-3">
                            <Skeleton className="w-10 h-10 rounded-lg" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-40" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        </SkeletonCard>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Features by Category */}
                      {(['clinical', 'business', 'marketing', 'integration'] as FeatureCategory[]).map(category => {
                        const categoryFeatures = features.filter(f => f.category === category)
                        if (categoryFeatures.length === 0) return null

                        const categoryNames = {
                          clinical: 'Funcionalidades Clínicas',
                          business: 'Funcionalidades de Negocio',
                          marketing: 'Marketing y Comunicación',
                          integration: 'Integraciones'
                        }

                        const categoryIcons = {
                          clinical: '🏥',
                          business: '💼',
                          marketing: '📢',
                          integration: '🔌'
                        }

                        return (
                          <div key={category} className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <span className="text-2xl">{categoryIcons[category]}</span>
                              {categoryNames[category]}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {categoryFeatures.map(feature => {
                                const config = FEATURE_CONFIG[feature.feature_key]
                                const isAdmin = user?.profile?.role === 'admin_tenant' || user?.profile?.role === 'super_admin'

                                return (
                                  <div
                                    key={feature.feature_key}
                                    className={`border rounded-lg p-4 ${
                                      feature.is_enabled
                                        ? 'border-green-200 bg-green-50'
                                        : feature.is_available_in_plan
                                        ? 'border-gray-200 bg-white'
                                        : 'border-gray-200 bg-gray-50 opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-2xl">{config.icon}</span>
                                          <h4 className="font-semibold text-gray-900">{feature.feature_name}</h4>
                                          {feature.is_premium && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                              Premium
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">
                                          {feature.description || config.shortDescription}
                                        </p>
                                        <div className="flex items-center gap-2">
                                          {feature.is_enabled ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                                              <Icons.checkCircle className="w-3 h-3" />
                                              Activa
                                            </span>
                                          ) : feature.is_available_in_plan ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                              <Icons.circle className="w-3 h-3" />
                                              Disponible
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                              <Icons.lock className="w-3 h-3" />
                                              No disponible en tu plan
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {isAdmin && feature.is_available_in_plan && (
                                        <button
                                          onClick={async () => {
                                            const success = await toggleFeature(
                                              feature.feature_key,
                                              !feature.is_enabled,
                                              `Toggled by ${user.profile?.email} at ${new Date().toISOString()}`
                                            )
                                            if (!success) {
                                              alert('Error al cambiar el estado de la funcionalidad')
                                            }
                                          }}
                                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                            feature.is_enabled ? 'bg-blue-600' : 'bg-gray-200'
                                          }`}
                                        >
                                          <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                              feature.is_enabled ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                          />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'general' && (
                <div className="p-6">
                  {tenantLoading ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-5 w-72" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : tenantData && currentTenantId ? (
                    <SettingsClient tenantData={tenantData} tenantId={currentTenantId} />
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.alertCircle className="w-8 h-8 text-red-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se pudo cargar la configuración</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Hubo un problema al cargar la información de tu negocio. Por favor, intenta recargar la página.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'team' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Gestión de Equipo</h2>
                    <p className="text-sm text-gray-600">Administra los miembros de tu equipo y sus permisos</p>
                  </div>

                  {/* Empty State */}
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icons.users className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión de Equipo</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Próximamente podrás invitar miembros, asignar roles y gestionar permisos de acceso.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Notificaciones</h2>
                    <p className="text-sm text-gray-600">Configura cómo y cuándo quieres recibir notificaciones</p>
                  </div>

                  {/* Empty State */}
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icons.bell className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Preferencias de Notificaciones</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Próximamente podrás configurar notificaciones por email, SMS y WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Facturación y Pagos</h2>
                    <p className="text-sm text-gray-600">Gestiona tu plan, métodos de pago e historial de facturas</p>
                  </div>

                  {/* Empty State */}
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icons.creditCard className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Facturación y Pagos</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Próximamente podrás ver tu plan actual, métodos de pago e historial de facturas.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Seguridad</h2>
                    <p className="text-sm text-gray-600">Protege tu cuenta y datos</p>
                  </div>

                  {/* Empty State */}
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icons.lock className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración de Seguridad</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Próximamente podrás cambiar tu contraseña, habilitar autenticación de dos factores y gestionar sesiones activas.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Icons.building className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Información del Negocio</h3>
                    <p className="text-sm text-gray-500">Actualiza datos básicos</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Icons.calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Horarios de Atención</h3>
                    <p className="text-sm text-gray-500">Define tu disponibilidad</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <Icons.package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Servicios y Productos</h3>
                    <p className="text-sm text-gray-500">Gestiona tu catálogo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
