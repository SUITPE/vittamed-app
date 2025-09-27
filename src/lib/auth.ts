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
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async signUp(email: string, password: string, userData: {
    first_name: string
    last_name: string
    role?: 'admin_tenant' | 'doctor' | 'patient'
  }) {
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
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    return { data, error }
  }

  async signInWithOAuth(provider: 'google' | 'facebook' | 'apple') {
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
    const { data: { user } } = await this.supabase.auth.getUser()

    if (!user) return null

    // Try to get user profile, but handle the case where it doesn't exist
    let profile = undefined
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        profile = data
      } else if (error?.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error)
      }
    } catch (error) {
      console.warn('Could not fetch user profile, this is expected for new users:', error)
    }

    // If no profile exists, create a default based on the email for demo users
    if (!profile && user.email) {
      // Create default profiles for known demo users
      let defaultRole: 'admin_tenant' | 'doctor' | 'patient' = 'patient'
      let defaultTenantId = null
      let defaultDoctorId = null

      if (user.email === 'admin@clinicasanrafael.com') {
        defaultRole = 'admin_tenant'
        defaultTenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      } else if (user.email === 'ana.rodriguez@email.com') {
        defaultRole = 'doctor'
        defaultDoctorId = '550e8400-e29b-41d4-a716-446655440001'
      } else if (user.email === 'patient@example.com') {
        defaultRole = 'patient'
      }

      profile = {
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || user.email.split('@')[0],
        last_name: user.user_metadata?.last_name || 'User',
        role: defaultRole,
        tenant_id: defaultTenantId,
        doctor_id: defaultDoctorId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Try to insert the profile into the database, but don't fail if it doesn't work
      try {
        const { error: insertError } = await this.supabase
          .from('user_profiles')
          .insert(profile)
          .select()
          .single()

        if (insertError && insertError.code !== '23505') { // 23505 is unique constraint violation
          console.warn('Could not insert user profile:', insertError)
        }
      } catch (insertError) {
        console.warn('Could not insert user profile, using temporary profile:', insertError)
      }
    }

    return {
      ...user,
      profile: profile || undefined
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
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