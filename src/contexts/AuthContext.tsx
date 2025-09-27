'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authService, AuthUser } from '@/lib/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, userData: {
    first_name: string
    last_name: string
    role?: 'admin_tenant' | 'doctor' | 'patient'
  }) => Promise<{ error: Error | null }>
  signInWithOAuth: (provider: 'google' | 'facebook' | 'apple') => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial user with error handling
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        if (mounted) {
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Error getting current user:', error)
        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes with error handling
    let subscription: any
    try {
      const result = authService.onAuthStateChange((authUser) => {
        if (mounted) {
          setUser(authUser)
          setLoading(false)
        }
      })
      subscription = result?.data?.subscription
    } catch (error) {
      console.error('Error setting up auth state listener:', error)
      if (mounted) {
        setLoading(false)
      }
    }

    return () => {
      mounted = false
      if (subscription?.unsubscribe) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await authService.signIn(email, password)

    if (!error) {
      const user = await authService.getCurrentUser()
      setUser(user)
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
      // Note: User might need to verify email before getting profile
      const user = await authService.getCurrentUser()
      setUser(user)
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
      localStorage.clear()
      window.location.href = '/auth/login'
      setLoading(false)
      return { error: err }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signInWithOAuth,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}