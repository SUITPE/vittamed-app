import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'
import { UserRole } from '@/types/user'

export interface UserProfile {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  role: UserRole
  tenant_id: string | null
  doctor_id: string | null
  created_at: string
  updated_at: string
}

export interface AuthUser extends User {
  profile?: UserProfile
}

class AuthService {
  private _supabase: ReturnType<typeof createBrowserClient> | null = null

  private get supabase() {
    if (!this._supabase) {
      // Only initialize if environment variables are available
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        this._supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
      } else {
        // During SSR or when env vars are not available, return a mock client
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
    if (!this.supabase) {
      return null
    }

    const { data: { user } } = await this.supabase.auth.getUser()

    if (!user) return null

    // Simple fallback profile - role determination will be done based on database profile
    let fallbackProfile = null
    if (user.email) {
      fallbackProfile = {
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || user.email.split('@')[0],
        last_name: user.user_metadata?.last_name || 'User',
        role: 'patient' as UserRole, // Default role, will be overridden by database profile
        tenant_id: null,
        doctor_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }

    // Try to get user profile from database, but don't fail if it doesn't work
    let dbProfile = undefined
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        dbProfile = data
        console.log('✅ Successfully fetched user profile from database:', data.role)
      } else {
        console.warn('Could not fetch user profile from database, using fallback. Error:', error?.message || 'Unknown')
      }
    } catch (error) {
      console.warn('Exception fetching user profile, using fallback:', error)
    }

    // Use database profile if available, otherwise use fallback
    const profile = dbProfile || fallbackProfile

    if (profile) {
      console.log(`👤 User role determined: ${profile.role} for ${profile.email}`)
    }

    return {
      ...user,
      profile: profile || undefined
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!this.supabase) {
      return null
    }

    const { data, error } = await this.supabase
      .from('user_profiles')
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
      .from('user_profiles')
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

      return data?.map(dt => dt.tenant_id) || []
    }

    return []
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    if (!this.supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } }
    }

    return this.supabase.auth.onAuthStateChange(async (event, session) => {
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