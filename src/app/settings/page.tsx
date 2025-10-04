'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import { Icons } from '@/components/ui/Icons'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'general' | 'team' | 'notifications' | 'billing' | 'security'>('general')

  const currentTenantId = user?.profile?.tenant_id || undefined

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar tenantId={currentTenantId} />
        <AdminHeader />
        <div className="ml-64 pt-16 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando configuración...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar tenantId={currentTenantId} />
      <AdminHeader />

      <div className="ml-64 pt-16">
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
                    onClick={() => setActiveTab('general')}
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
                    onClick={() => setActiveTab('team')}
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
                    onClick={() => setActiveTab('notifications')}
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
                    onClick={() => setActiveTab('billing')}
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
                    onClick={() => setActiveTab('security')}
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
              {activeTab === 'general' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuración General</h2>
                    <p className="text-sm text-gray-600">Información básica de tu negocio y preferencias</p>
                  </div>

                  {/* Empty State */}
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icons.settings className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración General</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Próximamente podrás gestionar la información de tu negocio, horarios y preferencias generales.
                    </p>
                  </div>
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
