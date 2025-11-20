import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { UserProfile, AuthUser } from './auth'

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'vittasami-dev-secret-key-2024'
const JWT_EXPIRES_IN = '7d'
const COOKIE_NAME = 'vittasami-auth-token'

interface JWTPayload {
  userId: string
  email: string
  role: string
  tenantId?: string
  iat?: number
  exp?: number
}

// Supabase client for database operations only (no auth)
// IMPORTANT: Use SERVICE_ROLE_KEY to bypass RLS for authentication operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvvxeqhsatkqtsrulcil.supabase.co'

  // Debug environment variables
  console.log('🔍 Environment check:')
  console.log('  - SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  // For authentication operations, we MUST use SERVICE_ROLE_KEY to bypass RLS
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw'

  // Use SERVICE_ROLE_KEY if available, otherwise fall back to ANON with warning
  const supabaseKey = serviceRoleKey || anonKey

  if (!serviceRoleKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found! Using ANON key - this will cause RLS issues')
    console.warn('⚠️ Make sure the .env.local file is correctly loaded')
  } else {
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY found and will be used')
  }

  // Debug the actual key content
  console.log('🔍 Key debug:')
  console.log('  - serviceRoleKey length:', serviceRoleKey?.length || 0)

  // Properly detect SERVICE_ROLE by checking if we have a dedicated SERVICE_ROLE key
  const isServiceRole = !!serviceRoleKey && serviceRoleKey !== anonKey
  console.log('  - Is using SERVICE_ROLE key:', isServiceRole)
  console.log('  - Using key preview:', supabaseKey.substring(0, 50) + '...')

  const keyType = isServiceRole ? 'SERVICE_ROLE' : 'ANON'
  console.log('🔑 Auth client using:', keyType, 'key')

  if (keyType === 'ANON') {
    console.warn('⚠️ Using ANON key for auth operations - this may cause RLS issues')
  }

  return createClient(supabaseUrl, supabaseKey)
}

export class CustomAuthService {
  private supabase = getSupabaseClient()

  // Generate JWT token
  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  }

  // Verify JWT token
  verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      console.error('JWT verification failed:', error)
      return null
    }
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // Get user by email and verify password
  async authenticateUser(email: string, password: string): Promise<UserProfile | null> {
    try {
      console.log('🔍 Starting authentication for:', email)

      const { data: user, error } = await this.supabase
        .from('custom_users')
        .select('*')
        .eq('email', email)
        .single()

      console.log('📋 Database query result:')
      console.log('  - Error:', error)
      console.log('  - User found:', !!user)
      console.log('  - User data preview:', user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        has_password: !!user.password_hash
      } : 'No user data')

      if (error || !user) {
        console.log('❌ User not found:', email, 'Error:', error)
        return null
      }

      // For existing users without password_hash, use a temporary verification
      // This allows migration of existing demo users
      if (!user.password_hash) {
        // For demo purposes, accept "password" as the password for existing users
        if (password === 'password') {
          console.log('Demo authentication successful for:', email)
          return user
        }
        console.log('No password hash found for user:', email)
        return null
      }

      const isValid = await this.verifyPassword(password, user.password_hash)
      if (!isValid) {
        console.log('Invalid password for user:', email)
        return null
      }

      console.log('Authentication successful for:', email)
      return user
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  }

  // Set authentication cookie
  async setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })
  }

  // Clear authentication cookie
  async clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
  }

  // Get current user from cookie
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get(COOKIE_NAME)?.value

      if (!token) {
        return null
      }

      const payload = this.verifyToken(token)
      if (!payload) {
        return null
      }

      // Fetch fresh user data from database
      const { data: profile, error } = await this.supabase
        .from('custom_users')
        .select('*')
        .eq('id', payload.userId)
        .single()

      if (error || !profile) {
        console.error('Error fetching user profile:', error)
        return null
      }

      // Remove password_hash before returning
      const { password_hash: _, ...safeProfile } = profile

      // Return AuthUser format
      return {
        id: safeProfile.id,
        email: safeProfile.email,
        email_confirmed_at: new Date().toISOString(), // Assume confirmed for custom auth
        user_metadata: {
          first_name: safeProfile.first_name,
          last_name: safeProfile.last_name
        },
        profile: safeProfile
      } as AuthUser
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Get token from cookie (for middleware)
  async getTokenFromCookie(): Promise<string | null> {
    try {
      const cookieStore = await cookies()
      return cookieStore.get(COOKIE_NAME)?.value || null
    } catch {
      return null
    }
  }

  // Create new user with password
  async createUser(userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    role?: 'admin_tenant' | 'doctor' | 'patient'
    tenant_id?: string
  }): Promise<{ user: UserProfile | null; error: string | null }> {
    try {
      // Check if user already exists
      const { data: existingUser } = await this.supabase
        .from('custom_users')
        .select('id')
        .eq('email', userData.email)
        .single()

      if (existingUser) {
        return { user: null, error: 'User already exists' }
      }

      // Hash password
      const password_hash = await this.hashPassword(userData.password)

      // Create user
      const { data: newUser, error } = await this.supabase
        .from('custom_users')
        .insert({
          id: crypto.randomUUID(),
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role || 'patient',
          tenant_id: userData.tenant_id || null,
          password_hash,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        return { user: null, error: error.message }
      }

      return { user: newUser, error: null }
    } catch (error) {
      console.error('Error in createUser:', error)
      return { user: null, error: 'Failed to create user' }
    }
  }

  // Update user password
  async updatePassword(userId: string, newPassword: string): Promise<{ error: string | null }> {
    try {
      const password_hash = await this.hashPassword(newPassword)

      const { error } = await this.supabase
        .from('custom_users')
        .update({
          password_hash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        console.error('Error updating password:', error)
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Error in updatePassword:', error)
      return { error: 'Failed to update password' }
    }
  }

  // Determine redirect path based on user role
  getRedirectPath(profile: UserProfile): string {
    switch (profile.role) {
      case 'super_admin':
        return '/admin/manage-users'
      case 'admin_tenant':
      case 'staff':
      case 'receptionist':
        if (profile.tenant_id) {
          return `/dashboard/${profile.tenant_id}`
        }
        return '/dashboard'
      case 'doctor':
        return '/agenda'
      case 'patient':
        return '/my-appointments'
      default:
        return '/dashboard'
    }
  }

  // Check if user is super admin
  isSuperAdmin(user: AuthUser | null): boolean {
    return user?.profile?.role === 'super_admin'
  }

  // Create super admin user (special method with elevated privileges)
  async createSuperAdmin(userData: {
    email: string
    password: string
    first_name: string
    last_name: string
  }): Promise<{ user: UserProfile | null; error: string | null }> {
    try {
      // Hash password
      const password_hash = await this.hashPassword(userData.password)

      // Create super admin user (tenant_id is null for super admins)
      const { data: newUser, error } = await this.supabase
        .from('custom_users')
        .insert({
          id: crypto.randomUUID(),
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: 'super_admin',
          tenant_id: null, // Super admins are not tied to any specific tenant
          password_hash,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating super admin:', error)
        return { user: null, error: error.message }
      }

      console.log('✅ Super admin created successfully:', {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      })

      return { user: newUser, error: null }
    } catch (error) {
      console.error('Error in createSuperAdmin:', error)
      return { user: null, error: 'Failed to create super admin user' }
    }
  }

  // Log audit action for super admin
  async logAuditAction(
    action: string,
    resourceType?: string,
    resourceId?: string,
    tenantId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const user = await this.getCurrentUser()
      if (!user || !this.isSuperAdmin(user)) {
        console.warn('Audit log attempted by non-super-admin user')
        return
      }

      await this.supabase
        .from('super_admin_audit_log')
        .insert({
          user_id: user.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          tenant_id: tenantId,
          metadata,
          ip_address: ipAddress,
          user_agent: userAgent
        })

      console.log('✅ Audit action logged:', {
        user_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId
      })
    } catch (error) {
      console.error('Failed to log audit action:', error)
    }
  }
}

// Export singleton instance
export const customAuth = new CustomAuthService()