'use client'

import { useState } from 'react'
import { useMultiTenantAuth } from '@/contexts/MultiTenantAuthContext'
import { UserTenant, getRoleDisplayName, getRoleColor } from '@/types/user'
import { BUSINESS_TYPE_CONFIGS } from '@/types/business'

interface TenantSwitcherProps {
  className?: string
  showFullDetails?: boolean
}

export default function TenantSwitcher({
  className = '',
  showFullDetails = true
}: TenantSwitcherProps) {
  const {
    currentTenant,
    availableTenants,
    hasMultipleTenants,
    switchTenant,
    loading
  } = useMultiTenantAuth()

  const [switching, setSwitching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  if (!hasMultipleTenants || !currentTenant) {
    // If user only has one tenant, show current tenant info without dropdown
    if (currentTenant && showFullDetails) {
      const businessConfig = BUSINESS_TYPE_CONFIGS[currentTenant.tenant_type as keyof typeof BUSINESS_TYPE_CONFIGS]
      return (
        <div className={`flex items-center space-x-3 ${className}`}>
          <div className="text-2xl">{businessConfig?.icon || '🏢'}</div>
          <div>
            <div className="font-semibold text-gray-900">{currentTenant.tenant_name}</div>
            <div className="text-sm text-gray-500">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(currentTenant.role)}`}>
                {getRoleDisplayName(currentTenant.role)}
              </span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const handleTenantSwitch = async (tenantId: string) => {
    if (tenantId === currentTenant?.tenant_id) {
      setIsOpen(false)
      return
    }

    setSwitching(true)
    try {
      const result = await switchTenant(tenantId)
      if ('error' in result) {
        console.error('Failed to switch tenant:', result.error)
        // You might want to show a toast notification here
      } else {
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error switching tenant:', error)
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Current Tenant Display / Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || switching}
        className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 bg-white transition-colors w-full text-left"
      >
        {currentTenant && (
          <>
            <div className="text-2xl">
              {BUSINESS_TYPE_CONFIGS[currentTenant.tenant_type as keyof typeof BUSINESS_TYPE_CONFIGS]?.icon || '🏢'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate">
                {currentTenant.tenant_name}
              </div>
              {showFullDetails && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(currentTenant.role)}`}>
                    {getRoleDisplayName(currentTenant.role)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {BUSINESS_TYPE_CONFIGS[currentTenant.tenant_type as keyof typeof BUSINESS_TYPE_CONFIGS]?.label}
                  </span>
                </div>
              )}
            </div>
            <div className="text-gray-400">
              {switching ? (
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              ) : (
                <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
              Cambiar Negocio ({availableTenants.length})
            </div>
            {availableTenants.map((tenant) => {
              const businessConfig = BUSINESS_TYPE_CONFIGS[tenant.tenant_type as keyof typeof BUSINESS_TYPE_CONFIGS]
              const isCurrentTenant = tenant.tenant_id === currentTenant?.tenant_id

              return (
                <button
                  key={tenant.tenant_id}
                  onClick={() => handleTenantSwitch(tenant.tenant_id)}
                  disabled={switching || isCurrentTenant}
                  className={`w-full flex items-center space-x-3 px-3 py-3 hover:bg-gray-50 transition-colors ${
                    isCurrentTenant ? 'bg-blue-50 cursor-default' : 'cursor-pointer'
                  } ${switching ? 'opacity-50' : ''}`}
                >
                  <div className="text-xl">{businessConfig?.icon || '🏢'}</div>
                  <div className="flex-1 text-left min-w-0">
                    <div className={`font-medium truncate ${
                      isCurrentTenant ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {tenant.tenant_name}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(tenant.role)}`}>
                        {getRoleDisplayName(tenant.role)}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        {businessConfig?.label}
                      </span>
                    </div>
                  </div>
                  {isCurrentTenant && (
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer with management link for admins */}
          {currentTenant?.role === 'admin_tenant' && (
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to tenant management - you can implement this route
                  window.location.href = '/admin/manage-users'
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <span>Gestionar Usuarios</span>
                </div>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}