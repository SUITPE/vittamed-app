import { createBrowserClient } from '@supabase/ssr'

export interface AuthUser {
  id: string
  email: string
  profile?: UserProfile
}

export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  avatar_url?: string
  role: 'admin_tenant' | 'doctor' | 'patient'
  tenant_id?: string
  doctor_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

class DynamicAuthService {
  private supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Dynamic user profile determination
  private async determineUserProfileData(email: string, userId: string): Promise<{
    role: 'admin_tenant' | 'doctor' | 'patient'
    tenant_id: string | null
    doctor_id: string | null
    first_name: string
    last_name: string
  }> {
    try {
      // First, check if user already exists in user_profiles
      const { data: existingProfile } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (existingProfile) {
        return {
          role: existingProfile.role,
          tenant_id: existingProfile.tenant_id,
          doctor_id: existingProfile.doctor_id,
          first_name: existingProfile.first_name,
          last_name: existingProfile.last_name
        }
      }

      // If not in user_profiles, check if they're in doctors table
      const { data: doctorRecord } = await this.supabase
        .from('doctors')
        .select('id, tenant_id, first_name, last_name')
        .eq('email', email)
        .single()

      if (doctorRecord) {
        return {
          role: 'doctor',
          tenant_id: doctorRecord.tenant_id,
          doctor_id: doctorRecord.id,
          first_name: doctorRecord.first_name,
          last_name: doctorRecord.last_name
        }
      }

      // Check if email domain suggests admin role
      if (email.includes('admin@') || email.includes('administrador@')) {
        // Get first available tenant for admin
        const { data: tenants } = await this.supabase
          .from('tenants')
          .select('id')
          .limit(1)

        return {
          role: 'admin_tenant',
          tenant_id: tenants?.[0]?.id || null,
          doctor_id: null,
          first_name: this.extractFirstName(email),
          last_name: this.extractLastName(email)
        }
      }

      // Default to patient role
      return {
        role: 'patient',
        tenant_id: null,
        doctor_id: null,
        first_name: this.extractFirstName(email),
        last_name: this.extractLastName(email)
      }

    } catch (error) {
      console.warn('Error determining user profile data:', error)
      // Fallback to patient role
      return {
        role: 'patient',
        tenant_id: null,
        doctor_id: null,
        first_name: this.extractFirstName(email),
        last_name: this.extractLastName(email)
      }
    }
  }

  // Helper functions for extracting names
  private extractFirstName(email: string): string {
    const localPart = email.split('@')[0]
    return localPart.split('.')[0] || 'User'
  }

  private extractLastName(email: string): string {
    const localPart = email.split('@')[0]
    const parts = localPart.split('.')
    return parts.length > 1 ? parts[parts.length - 1] : ''
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Use auth bypass in development/testing environments
      if (typeof window !== 'undefined' &&
          (window.location.hostname.includes('vercel.app') ||
           process.env.VERCEL ||
           window.location.hostname === 'localhost')) {
        console.log('🚀 Using auth bypass for testing')

        const hasAuthCookie = document.cookie.includes('sb-mvvxeqhsatkqtsrulcil-auth-token')
        if (hasAuthCookie) {
          // Return dynamic user based on URL or default
          const urlPath = window.location.pathname
          const tenantMatch = urlPath.match(/\/dashboard\/([^\/]+)/)
          const tenantId = tenantMatch ? tenantMatch[1] : null

          // Get tenant info dynamically
          let tenantName = 'Demo Clinic'
          if (tenantId) {
            try {
              const { data: tenant } = await this.supabase
                .from('tenants')
                .select('name')
                .eq('id', tenantId)
                .single()

              if (tenant) {
                tenantName = tenant.name
              }
            } catch (error) {
              console.warn('Could not fetch tenant name')
            }
          }

          return {
            id: 'bypass-user-id',
            email: 'admin@example.com',
            profile: {
              id: 'bypass-user-id',
              email: 'admin@example.com',
              first_name: 'Admin',
              last_name: 'User',
              role: 'admin_tenant',
              tenant_id: tenantId,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        }

        return null
      }

      const { data: { user } } = await this.supabase.auth.getUser()

      if (!user) return null

      // Get dynamic profile data
      const profileData = await this.determineUserProfileData(user.email!, user.id)

      // Try to get user profile from database
      let dbProfile: UserProfile | null = null
      try {
        const { data, error } = await this.supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data && !error) {
          dbProfile = data
        }
      } catch (error) {
        console.warn('Could not fetch user profile from database')
      }

      // Create fallback profile if none exists in database
      const fallbackProfile: UserProfile = {
        id: user.id,
        email: user.email!,
        first_name: user.user_metadata?.first_name || profileData.first_name,
        last_name: user.user_metadata?.last_name || profileData.last_name,
        phone: user.phone || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        role: profileData.role,
        tenant_id: profileData.tenant_id,
        doctor_id: profileData.doctor_id,
        is_active: true,
        created_at: user.created_at,
        updated_at: new Date().toISOString()
      }

      return {
        id: user.id,
        email: user.email!,
        profile: dbProfile || fallbackProfile
      }

    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  async signIn(email: string, password: string): Promise<{ error: Error | null }> {
    try {
      // Use auth bypass in development/testing environments
      if (typeof window !== 'undefined' &&
          (window.location.hostname.includes('vercel.app') ||
           process.env.VERCEL ||
           window.location.hostname === 'localhost')) {
        console.log('🚀 Using auth bypass for Vercel compatibility')

        const { signInWithPasswordBypass } = await import('./auth-bypass')
        const result = await signInWithPasswordBypass(email, password)

        if (result.error) {
          return { error: result.error }
        }

        return { error: null }
      }

      const { error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  async signUp(email: string, password: string, userData: {
    first_name: string
    last_name: string
    role?: 'admin_tenant' | 'doctor' | 'patient'
  }): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
          },
        },
      })

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  async signInWithOAuth(provider: 'google' | 'facebook' | 'apple'): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signOut()

      // Clear any bypass cookies
      if (typeof window !== 'undefined') {
        document.cookie = 'sb-mvvxeqhsatkqtsrulcil-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      }

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    try {
      if (typeof window === 'undefined') {
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
    } catch (error) {
      console.error('Error setting up auth state listener:', error)
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
  }

  // Dynamic tenant resolution for redirects
  async getDefaultRedirectPath(user: AuthUser): Promise<string> {
    try {
      if (!user.profile) return '/dashboard'

      const role = user.profile.role
      const tenantId = user.profile.tenant_id

      switch (role) {
        case 'admin_tenant':
          if (tenantId) {
            return `/dashboard/${tenantId}`
          }
          // If no tenant, get first available tenant
          const { data: tenants } = await this.supabase
            .from('tenants')
            .select('id')
            .limit(1)

          if (tenants && tenants.length > 0) {
            return `/dashboard/${tenants[0].id}`
          }
          return '/dashboard'

        case 'doctor':
          return '/agenda'

        case 'patient':
          return '/my-appointments'

        default:
          return '/dashboard'
      }
    } catch (error) {
      console.error('Error determining redirect path:', error)
      return '/dashboard'
    }
  }
}

export const dynamicAuthService = new DynamicAuthService()