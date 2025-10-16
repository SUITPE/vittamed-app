'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthUser } from '@/lib/auth'

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

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Get current user from API
  const getCurrentUser = async (): Promise<AuthUser | null> => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        return data.user
      } else {
        return null
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      return null
    }
  }

  useEffect(() => {
    let mounted = true

    // Get initial user
    const initializeAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
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

    return () => {
      mounted = false
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        // Fetch updated user data
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        setLoading(false)
        return { error: null }
      } else {
        const errorData = await response.json()
        setLoading(false)
        return { error: new Error(errorData.error || 'Login failed') }
      }
    } catch (error) {
      console.error('SignIn error:', error)
      setLoading(false)
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, userData: {
    first_name: string
    last_name: string
    role?: 'admin_tenant' | 'doctor' | 'patient'
  }) => {
    setLoading(true)
    try {
      // For now, signUp is not implemented
      setLoading(false)
      return { error: new Error('SignUp not implemented yet') }
    } catch (error) {
      console.error('SignUp error:', error)
      setLoading(false)
      return { error: error as Error }
    }
  }

  const signInWithOAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true)
    try {
      // OAuth not implemented yet
      setLoading(false)
      return { error: new Error(`OAuth with ${provider} not implemented yet`) }
    } catch (error) {
      console.error('OAuth error:', error)
      setLoading(false)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        setUser(null)
        // Redirect to login page
        window.location.href = '/auth/login'
        return { error: null }
      } else {
        console.error('Logout failed')
        // Force logout even if server request fails
        setUser(null)
        window.location.href = '/auth/login'
        return { error: new Error('Logout failed') }
      }
    } catch (err) {
      console.error('Unexpected error during signout:', err)
      // Force logout even if there's an error
      setUser(null)
      window.location.href = '/auth/login'
      return { error: err as Error }
    } finally {
      setLoading(false)
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