import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CustomAuthService } from '@/lib/custom-auth'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  })),
}))

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

describe('CustomAuthService', () => {
  let authService: CustomAuthService

  beforeEach(() => {
    authService = new CustomAuthService()
  })

  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123'
      const hash = await authService.hashPassword(password)

      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should verify a correct password', async () => {
      const password = 'testPassword123'
      const hash = await authService.hashPassword(password)
      const isValid = await authService.verifyPassword(password, hash)

      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'testPassword123'
      const wrongPassword = 'wrongPassword'
      const hash = await authService.hashPassword(password)
      const isValid = await authService.verifyPassword(wrongPassword, hash)

      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Generation', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'admin_tenant',
        tenantId: 'test-tenant-id',
      }

      const token = authService.generateToken(payload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should verify a valid JWT token', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'admin_tenant',
        tenantId: 'test-tenant-id',
      }

      const token = authService.generateToken(payload)
      const verified = authService.verifyToken(token)

      expect(verified).toBeDefined()
      expect(verified?.userId).toBe(payload.userId)
      expect(verified?.email).toBe(payload.email)
      expect(verified?.role).toBe(payload.role)
    })

    it('should reject an invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const verified = authService.verifyToken(invalidToken)

      expect(verified).toBeNull()
    })
  })

  describe('Redirect Paths', () => {
    it('should return correct redirect for admin_tenant', () => {
      const profile = {
        id: 'test-id',
        email: 'admin@test.com',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin_tenant' as const,
        tenant_id: 'tenant-123',
        doctor_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const path = authService.getRedirectPath(profile)
      expect(path).toBe('/dashboard/tenant-123')
    })

    it('should return correct redirect for doctor', () => {
      const profile = {
        id: 'test-id',
        email: 'doctor@test.com',
        first_name: 'Doctor',
        last_name: 'User',
        role: 'doctor' as const,
        tenant_id: 'tenant-123',
        doctor_id: 'doctor-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const path = authService.getRedirectPath(profile)
      expect(path).toBe('/agenda')
    })

    it('should return correct redirect for patient', () => {
      const profile = {
        id: 'test-id',
        email: 'patient@test.com',
        first_name: 'Patient',
        last_name: 'User',
        role: 'patient' as const,
        tenant_id: null,
        doctor_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const path = authService.getRedirectPath(profile)
      expect(path).toBe('/my-appointments')
    })
  })

  describe('Role Validation', () => {
    it('should correctly identify super admin', () => {
      const superAdminUser = {
        id: 'test-id',
        email: 'superadmin@test.com',
        profile: {
          id: 'test-id',
          email: 'superadmin@test.com',
          first_name: 'Super',
          last_name: 'Admin',
          role: 'super_admin' as const,
          tenant_id: null,
          doctor_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }

      const isSuperAdmin = authService.isSuperAdmin(superAdminUser)
      expect(isSuperAdmin).toBe(true)
    })

    it('should not identify non-super admin as super admin', () => {
      const regularUser = {
        id: 'test-id',
        email: 'user@test.com',
        profile: {
          id: 'test-id',
          email: 'user@test.com',
          first_name: 'Regular',
          last_name: 'User',
          role: 'admin_tenant' as const,
          tenant_id: 'tenant-123',
          doctor_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }

      const isSuperAdmin = authService.isSuperAdmin(regularUser)
      expect(isSuperAdmin).toBe(false)
    })
  })
})
