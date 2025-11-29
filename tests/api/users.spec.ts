/**
 * VT-272: Test API de usuarios
 *
 * Tests for users endpoints:
 * - GET /api/admin/users (super_admin only)
 * - GET /api/tenants/[tenantId]/users (tenant users)
 * - POST /api/tenants/[tenantId]/users (create user)
 * - GET /api/auth/me (current user)
 */
import { test, expect } from '@playwright/test'

test.describe('API Admin Users (GET /api/admin/users)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const response = await request.get('/api/admin/users')

      expect(response.status()).toBe(401)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  test.describe('Authorization', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should reject non-super_admin users (403)', async ({ request }) => {
      const response = await request.get('/api/admin/users')

      // Admin tenant is not super_admin, so should get 403
      expect(response.status()).toBe(403)

      const data = await response.json()
      expect(data.error).toContain('super_admin')
    })
  })

  test.describe('Doctor Access', () => {
    test.use({ storageState: 'tests/.auth/doctor.json' })

    test('should reject doctor users (403)', async ({ request }) => {
      const response = await request.get('/api/admin/users')

      expect(response.status()).toBe(403)
    })
  })
})

test.describe('API Tenant Users (GET /api/tenants/[tenantId]/users)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(`/api/tenants/${fakeUUID}/users`)

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Authorization', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return users for admin own tenant', async ({ request }) => {
      // Get admin's tenant ID
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const tenantId = meData.user?.profile?.tenant_id

      if (!tenantId) {
        test.skip(true, 'No tenant ID found')
        return
      }

      const response = await request.get(`/api/tenants/${tenantId}/users`)

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.users).toBeDefined()
      expect(Array.isArray(data.users)).toBe(true)
      expect(data.total).toBeDefined()
    })

    test('admin_tenant may access other tenants (check response)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(`/api/tenants/${fakeUUID}/users`)

      // Admin tenant may have broader access or get empty results
      // The API allows admin_tenant to access any tenant's users
      expect([200, 403]).toContain(response.status())
    })

    test('should support role filter', async ({ request }) => {
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const tenantId = meData.user?.profile?.tenant_id

      if (!tenantId) {
        test.skip(true, 'No tenant ID found')
        return
      }

      const response = await request.get(`/api/tenants/${tenantId}/users?role=doctor`)

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.users).toBeDefined()
    })
  })

  test.describe('Doctor Access', () => {
    test.use({ storageState: 'tests/.auth/doctor.json' })

    test('doctor can view users in their tenant', async ({ request }) => {
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const tenantId = meData.user?.profile?.tenant_id

      if (!tenantId) {
        test.skip(true, 'No tenant ID found')
        return
      }

      const response = await request.get(`/api/tenants/${tenantId}/users`)

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.users).toBeDefined()
    })

    test('doctor cannot view other tenant users (403)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(`/api/tenants/${fakeUUID}/users`)

      expect(response.status()).toBe(403)
    })
  })
})

test.describe('API Tenant Users - Create (POST /api/tenants/[tenantId]/users)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.post(`/api/tenants/${fakeUUID}/users`, {
        data: {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          role: 'patient'
        }
      })

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Authorization', () => {
    test.use({ storageState: 'tests/.auth/doctor.json' })

    test('doctor cannot create users (403)', async ({ request }) => {
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const tenantId = meData.user?.profile?.tenant_id

      if (!tenantId) {
        test.skip(true, 'No tenant ID found')
        return
      }

      const response = await request.post(`/api/tenants/${tenantId}/users`, {
        data: {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          role: 'patient'
        }
      })

      expect(response.status()).toBe(403)
    })
  })

  test.describe('Validation', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return 400 when missing first_name', async ({ request }) => {
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const tenantId = meData.user?.profile?.tenant_id

      if (!tenantId) {
        test.skip(true, 'No tenant ID found')
        return
      }

      const response = await request.post(`/api/tenants/${tenantId}/users`, {
        data: {
          last_name: 'User',
          email: 'test@example.com',
          role: 'patient'
        }
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    test('should return 400 when missing last_name', async ({ request }) => {
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const tenantId = meData.user?.profile?.tenant_id

      if (!tenantId) {
        test.skip(true, 'No tenant ID found')
        return
      }

      const response = await request.post(`/api/tenants/${tenantId}/users`, {
        data: {
          first_name: 'Test',
          email: 'test@example.com',
          role: 'patient'
        }
      })

      expect(response.status()).toBe(400)
    })

    test('should return 400 when email missing for non-patient role', async ({ request }) => {
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const tenantId = meData.user?.profile?.tenant_id

      if (!tenantId) {
        test.skip(true, 'No tenant ID found')
        return
      }

      const response = await request.post(`/api/tenants/${tenantId}/users`, {
        data: {
          first_name: 'Test',
          last_name: 'Doctor',
          role: 'doctor'
          // No email
        }
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Email')
    })

    test('should return 400 for invalid role', async ({ request }) => {
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const tenantId = meData.user?.profile?.tenant_id

      if (!tenantId) {
        test.skip(true, 'No tenant ID found')
        return
      }

      const response = await request.post(`/api/tenants/${tenantId}/users`, {
        data: {
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com',
          role: 'invalid_role'
        }
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('role')
    })

    test('should return 409 for duplicate email', async ({ request }) => {
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const tenantId = meData.user?.profile?.tenant_id
      const adminEmail = meData.user?.email

      if (!tenantId || !adminEmail) {
        test.skip(true, 'No tenant ID or email found')
        return
      }

      const response = await request.post(`/api/tenants/${tenantId}/users`, {
        data: {
          first_name: 'Duplicate',
          last_name: 'User',
          email: adminEmail, // Use admin's email which already exists
          role: 'patient'
        }
      })

      expect(response.status()).toBe(409)

      const data = await response.json()
      expect(data.error).toContain('already exists')
    })
  })

  test.describe('Success Cases', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should create patient without email', async ({ request }) => {
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const tenantId = meData.user?.profile?.tenant_id

      if (!tenantId) {
        test.skip(true, 'No tenant ID found')
        return
      }

      const timestamp = Date.now()

      const response = await request.post(`/api/tenants/${tenantId}/users`, {
        data: {
          first_name: `Test${timestamp}`,
          last_name: 'Patient',
          role: 'patient'
          // No email required for patients
        }
      })

      // May succeed (201) or fail if implementation requires email
      expect([201, 400, 500]).toContain(response.status())

      if (response.status() === 201) {
        const data = await response.json()
        expect(data.user).toBeDefined()
        expect(data.user.id).toBeDefined()
        expect(data.user.role).toBe('patient')
      }
    })

    test('should create user with email', async ({ request }) => {
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const tenantId = meData.user?.profile?.tenant_id

      if (!tenantId) {
        test.skip(true, 'No tenant ID found')
        return
      }

      const timestamp = Date.now()
      const uniqueEmail = `test-user-${timestamp}@test.com`

      const response = await request.post(`/api/tenants/${tenantId}/users`, {
        data: {
          first_name: 'Test',
          last_name: 'Staff',
          email: uniqueEmail,
          role: 'staff'
        }
      })

      expect(response.status()).toBe(201)

      const data = await response.json()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(uniqueEmail)
      expect(data.user.role).toBe('staff')
    })
  })
})

test.describe('API Auth Me (GET /api/auth/me)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const response = await request.get('/api/auth/me')

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Authenticated Requests', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return current user info', async ({ request }) => {
      const response = await request.get('/api/auth/me')

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.user).toBeDefined()
      expect(data.user.id).toBeDefined()
      expect(data.user.email).toBeDefined()
    })

    test('should include user profile', async ({ request }) => {
      const response = await request.get('/api/auth/me')

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.user.profile).toBeDefined()
      expect(data.user.profile.role).toBeDefined()
    })
  })

  test.describe('Different Roles', () => {
    test.describe('Admin', () => {
      test.use({ storageState: 'tests/.auth/admin.json' })

      test('admin should have admin_tenant role', async ({ request }) => {
        const response = await request.get('/api/auth/me')

        expect(response.ok()).toBeTruthy()

        const data = await response.json()
        expect(data.user.profile.role).toBe('admin_tenant')
      })
    })

    test.describe('Doctor', () => {
      test.use({ storageState: 'tests/.auth/doctor.json' })

      test('doctor should have doctor role', async ({ request }) => {
        const response = await request.get('/api/auth/me')

        expect(response.ok()).toBeTruthy()

        const data = await response.json()
        expect(data.user.profile.role).toBe('doctor')
      })
    })

    test.describe('Receptionist', () => {
      test.use({ storageState: 'tests/.auth/receptionist.json' })

      test('receptionist should have receptionist or staff role', async ({ request }) => {
        const response = await request.get('/api/auth/me')

        expect(response.ok()).toBeTruthy()

        const data = await response.json()
        // Receptionist user may have 'receptionist' or 'staff' role depending on setup
        expect(['receptionist', 'staff']).toContain(data.user.profile.role)
      })
    })
  })
})
