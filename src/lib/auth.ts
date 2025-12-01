import { createBrowserClient } from '@supabase/ssr'
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { UserRole } from '@/types/user'

export interface UserProfile {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: UserRole
  tenant_id: string | null
  doctor_id: string | null
  schedulable?: boolean
  created_at: string
  updated_at: string
  // Additional fields used by custom auth and profile features
  phone?: string | null
  date_of_birth?: string | null
  address?: string | null
  email_verified?: boolean
  must_change_password?: boolean
  password_hash?: string
}

export interface AuthUser extends User {
  profile?: UserProfile
}

class AuthService {
  private _supabase: ReturnType<typeof createBrowserClient> | null = null

  private get supabase() {
    if (!this._supabase) {
      // Only initialize if we're in browser and environment variables are available
      if (typeof window !== 'undefined') {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvvxeqhsatkqtsrulcil.supabase.co'
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw'

        console.log('🔧 Initializing Supabase client:', {
          url: supabaseUrl,
          hasKey: !!supabaseKey,
          keyLength: supabaseKey.length
        })

        try {
          this._supabase = createBrowserClient(supabaseUrl, supabaseKey)
          console.log('✅ Supabase client initialized successfully')
        } catch (error) {
          console.error('❌ Failed to initialize Supabase client:', error)
          return null as any
        }
      } else {
        // During SSR, return null but don't error
        console.log('🔄 SSR detected, Supabase client will be initialized on client side')
        return null as any
      }
    }
    return this._supabase
  }

  async signUp(email: string, password: string, userData: {
    first_name: string
    last_name: string
    role?: 'admin_tenant' | 'doctor' | 'patient'
  }) {
    if (!this.supabase) {
      return { data: null, error: { message: 'Supabase client not available during SSR' } }
    }

    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role || 'patient'
        }
      }
    })

    return { data, error }
  }

  async signIn(email: string, password: string) {
    if (!this.supabase) {
      return { data: null, error: { message: 'Supabase client not available during SSR' } }
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    return { data, error }
  }

  async signInWithOAuth(provider: 'google' | 'facebook' | 'apple') {
    if (!this.supabase || typeof window === 'undefined') {
      return { data: null, error: { message: 'Supabase client not available during SSR' } }
    }

    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    return { data, error }
  }

  async signOut() {
    try {
      if (!this.supabase) {
        return { error: { message: 'Supabase client not available during SSR' } }
      }

      // Sign out from Supabase
      const { error } = await this.supabase.auth.signOut()

      // Clear any localStorage data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        // Clear all Supabase related storage
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key)
          }
        })
      }

      return { error }
    } catch (err) {
      console.error('Error during signOut:', err)
      return { error: err }
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Enhanced client availability check
      if (!this.supabase) {
        console.log('⚠️ getCurrentUser: Supabase client not available')

        // Try to reinitialize client if in browser
        if (typeof window !== 'undefined') {
          console.log('🔄 Attempting to reinitialize Supabase client...')
          const tempClient = this.supabase // This triggers the getter
          if (!tempClient) {
            console.error('❌ Failed to reinitialize Supabase client')
            return null
          }
        } else {
          console.log('🔄 SSR environment detected, returning null')
          return null
        }
      }

      console.log('🔍 getCurrentUser: Fetching user from Supabase')

      // Enhanced timeout handling for auth calls
      const authPromise = this.supabase!.auth.getUser()
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Auth request timeout')), 5000)
      })

      const { data: { user }, error } = await Promise.race([authPromise, timeoutPromise])

      if (error) {
        console.error('❌ getCurrentUser: Supabase auth error:', {
          message: error.message,
          status: error.status,
          code: error.code || 'unknown'
        })
        return null
      }

      if (!user) {
        console.log('👤 getCurrentUser: No authenticated user found')
        return null
      }

      console.log('👤 getCurrentUser: Found user:', {
        id: user.id,
        email: user.email,
        hasMetadata: !!user.user_metadata,
        emailConfirmed: user.email_confirmed_at ? 'Yes' : 'No'
      })

      // Create robust fallback profile
      let fallbackProfile = null
      if (user.email) {
        const emailPrefix = user.email.split('@')[0]
        fallbackProfile = {
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || emailPrefix,
          last_name: user.user_metadata?.last_name || 'User',
          role: 'patient' as UserRole,
          tenant_id: null,
          doctor_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        console.log('📋 Created fallback profile:', {
          role: fallbackProfile.role,
          name: `${fallbackProfile.first_name} ${fallbackProfile.last_name}`
        })
      }

      // Enhanced database profile fetch with better error handling
      let dbProfile = undefined
      try {
        console.log('🔍 Fetching user profile from database...')

        const profilePromise = this.supabase!
          .from('custom_users')
          .select('*')
          .eq('id', user.id)
          .single()

        const profileTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
        })

        const { data, error } = await Promise.race([profilePromise, profileTimeoutPromise])

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('📝 No user profile found in database (new user)')
          } else {
            console.warn('⚠️ Database profile fetch error:', {
              message: error.message,
              code: error.code,
              details: error.details
            })
          }
        } else if (data) {
          dbProfile = data
          console.log('✅ Successfully fetched user profile from database:', {
            role: data.role,
            tenantId: data.tenant_id,
            doctorId: data.doctor_id
          })
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Profile fetch timeout') {
            console.error('⏱️ Database profile fetch timed out')
          } else {
            console.warn('🚨 Exception fetching user profile:', error.message)
          }
        } else {
          console.warn('🚨 Unknown error fetching user profile:', error)
        }
      }

      // Select best available profile
      const profile = dbProfile || fallbackProfile

      if (profile) {
        console.log(`👤 User profile resolved:`, {
          source: dbProfile ? 'database' : 'fallback',
          role: profile.role,
          email: profile.email,
          hasTenant: !!profile.tenant_id,
          hasDoctor: !!profile.doctor_id
        })
      } else {
        console.error('❌ No profile available for user')
      }

      const authUser = {
        ...user,
        profile: profile || undefined
      }

      console.log('✅ getCurrentUser completed successfully')
      return authUser

    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Auth request timeout') {
          console.error('⏱️ Auth request timed out after 15 seconds')
        } else {
          console.error('❌ getCurrentUser: Unexpected error:', {
            message: error.message,
            stack: error.stack?.split('\n')[0]
          })
        }
      } else {
        console.error('❌ getCurrentUser: Unknown error type:', error)
      }
      return null
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!this.supabase) {
      return null
    }

    const { data, error } = await this.supabase
      .from('custom_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    if (!this.supabase) {
      return { data: null, error: { message: 'Supabase client not available during SSR' } }
    }

    const { data, error } = await this.supabase
      .from('custom_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  }

  async checkPermissions(userId: string, requiredRole: string, tenantId?: string): Promise<boolean> {
    const profile = await this.getUserProfile(userId)

    if (!profile) return false

    // Check role
    if (profile.role !== requiredRole) return false

    // Check tenant access if required
    if (tenantId && profile.tenant_id !== tenantId) return false

    return true
  }

  // Get user's accessible tenants
  async getUserTenants(userId: string): Promise<string[]> {
    if (!this.supabase) {
      return []
    }

    const profile = await this.getUserProfile(userId)

    if (!profile) return []

    if (profile.role === 'admin_tenant' && profile.tenant_id) {
      return [profile.tenant_id]
    }

    if (profile.role === 'doctor' && profile.doctor_id) {
      // Get all tenants this doctor works for
      const { data } = await this.supabase
        .from('doctor_tenants')
        .select('tenant_id')
        .eq('doctor_id', profile.doctor_id)
        .eq('is_active', true)

      return data?.map((dt: { tenant_id: string }) => dt.tenant_id) || []
    }

    return []
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!this.supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } }
    }

    return this.supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        const authUser = await this.getCurrentUser()
        callback(authUser)
      } else {
        callback(null)
      }
    })
  }
}

export const authService = new AuthService()