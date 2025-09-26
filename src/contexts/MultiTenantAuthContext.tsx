'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService, AuthUser } from '@/lib/auth'
import { UserTenant, UserWithRoles, SwitchTenantResponse } from '@/types/user'

interface MultiTenantAuthContextType {
  user: UserWithRoles | null
  loading: boolean
  currentTenant: UserTenant | null
  availableTenants: UserTenant[]
  hasMultipleTenants: boolean
  switchTenant: (tenantId: string) => Promise<SwitchTenantResponse | { error: string }>
  refreshTenants: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userData: {
    first_name: string
    last_name: string
    role?: 'admin_tenant' | 'doctor' | 'patient'
  }) => Promise<{ error: any }>
  signInWithOAuth: (provider: 'google' | 'facebook' | 'apple') => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

const MultiTenantAuthContext = createContext<MultiTenantAuthContextType | undefined>(undefined)

export function MultiTenantAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRoles | null>(null)
  const [currentTenant, setCurrentTenant] = useState<UserTenant | null>(null)
  const [availableTenants, setAvailableTenants] = useState<UserTenant[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch user's tenants from API
  const fetchUserTenants = async () => {
    try {
      const response = await fetch('/api/user/tenants')
      if (response.ok) {
        const data = await response.json()
        setAvailableTenants(data.tenants || [])
        setCurrentTenant(data.current_tenant || null)
        return data
      } else {
        console.error('Failed to fetch user tenants:', response.statusText)
        setAvailableTenants([])
        setCurrentTenant(null)
      }
    } catch (error) {
      console.error('Error fetching user tenants:', error)
      setAvailableTenants([])
      setCurrentTenant(null)
    }
    return null
  }

  // Initialize user with tenants
  const initializeUserWithTenants = async (authUser: AuthUser | null) => {
    if (authUser) {
      // Fetch tenants for this user
      const tenantsData = await fetchUserTenants()

      const userWithRoles: UserWithRoles = {
        id: authUser.id,
        email: authUser.email || '',
        first_name: authUser.profile?.first_name || undefined,
        last_name: authUser.profile?.last_name || undefined,
        current_tenant_id: tenantsData?.current_tenant?.tenant_id || undefined,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at,
        tenants: tenantsData?.tenants || [],
        current_tenant: tenantsData?.current_tenant || undefined
      }

      setUser(userWithRoles)
    } else {
      setUser(null)
      setCurrentTenant(null)
      setAvailableTenants([])
    }
  }

  useEffect(() => {
    // Get initial user
    authService.getCurrentUser()
      .then(initializeUserWithTenants)
      .finally(() => setLoading(false))

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (authUser) => {
      if (authUser) {
        await initializeUserWithTenants(authUser)
      } else {
        setUser(null)
        setCurrentTenant(null)
        setAvailableTenants([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshTenants = async () => {
    if (user) {
      await fetchUserTenants()
    }
  }

  const switchTenant = async (tenantId: string): Promise<SwitchTenantResponse | { error: string }> => {
    try {
      const response = await fetch('/api/user/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenant_id: tenantId })
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state
        setCurrentTenant(data.current_tenant)
        setAvailableTenants(data.tenants)

        // Update user object
        if (user) {
          const updatedUser: UserWithRoles = {
            ...user,
            current_tenant_id: data.current_tenant.tenant_id,
            tenants: data.tenants,
            current_tenant: data.current_tenant
          }
          setUser(updatedUser)
        }

        return data
      } else {
        return { error: data.error || 'Failed to switch tenant' }
      }
    } catch (error) {
      console.error('Error switching tenant:', error)
      return { error: 'Network error while switching tenant' }
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await authService.signIn(email, password)

    if (!error) {
      const authUser = await authService.getCurrentUser()
      await initializeUserWithTenants(authUser)
    }

    setLoading(false)
    return { error }
  }

  const signUp = async (email: string, password: string, userData: {
    first_name: string
    last_name: string
    role?: 'admin_tenant' | 'doctor' | 'patient'
  }) => {
    setLoading(true)
    const { error } = await authService.signUp(email, password, userData)

    if (!error) {
      const authUser = await authService.getCurrentUser()
      await initializeUserWithTenants(authUser)
    }

    setLoading(false)
    return { error }
  }

  const signInWithOAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true)
    const { error } = await authService.signInWithOAuth(provider)
    setLoading(false)
    return { error }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await authService.signOut()

      if (!error) {
        setUser(null)
        setCurrentTenant(null)
        setAvailableTenants([])
        // Clear any cached data
        localStorage.removeItem('supabase.auth.token')
        // Redirect to login page
        window.location.href = '/auth/login'
      } else {
        console.error('Error signing out:', error)
      }

      setLoading(false)
      return { error }
    } catch (err) {
      console.error('Unexpected error during signout:', err)
      // Force logout even if there's an error
      setUser(null)
      setCurrentTenant(null)
      setAvailableTenants([])
      localStorage.clear()
      window.location.href = '/auth/login'
      setLoading(false)
      return { error: err }
    }
  }

  const hasMultipleTenants = availableTenants.length > 1

  return (
    <MultiTenantAuthContext.Provider value={{
      user,
      loading,
      currentTenant,
      availableTenants,
      hasMultipleTenants,
      switchTenant,
      refreshTenants,
      signIn,
      signUp,
      signInWithOAuth,
      signOut
    }}>
      {children}
    </MultiTenantAuthContext.Provider>
  )
}

export function useMultiTenantAuth() {
  const context = useContext(MultiTenantAuthContext)
  if (context === undefined) {
    throw new Error('useMultiTenantAuth must be used within a MultiTenantAuthProvider')
  }
  return context
}

// Convenience hook for checking specific tenant access
export function useTenantAccess(requiredRole?: string) {
  const { user, currentTenant } = useMultiTenantAuth()

  const hasAccess = (tenantId?: string) => {
    if (!user || !currentTenant) return false

    const targetTenant = tenantId
      ? user.tenants.find(t => t.tenant_id === tenantId)
      : currentTenant

    if (!targetTenant) return false

    if (requiredRole) {
      return targetTenant.role === requiredRole || targetTenant.role === 'admin_tenant'
    }

    return true
  }

  const isAdmin = () => {
    return currentTenant?.role === 'admin_tenant'
  }

  const isDoctor = () => {
    return currentTenant?.role === 'doctor'
  }

  const isPatient = () => {
    return currentTenant?.role === 'patient'
  }

  return {
    hasAccess,
    isAdmin,
    isDoctor,
    isPatient,
    currentRole: currentTenant?.role
  }
}