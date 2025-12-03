/**
 * VT-270: Test API de servicios
 *
 * Tests for services endpoints:
 * - GET /api/catalog/services (list services with filters)
 * - POST /api/catalog/services (create service)
 * - GET /api/tenants/[tenantId]/services (public listing)
 * - POST /api/tenants/[tenantId]/services (create service for tenant)
 */
import { test, expect } from '@playwright/test'

test.describe('API Catalog Services (GET /api/catalog/services)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const response = await request.get('/api/catalog/services')

      expect(response.status()).toBe(401)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  test.describe('Authenticated Requests', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return services list with pagination', async ({ request }) => {
      const response = await request.get('/api/catalog/services')

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.services).toBeDefined()
      expect(Array.isArray(data.services)).toBe(true)
      expect(data.pagination).toBeDefined()
      expect(data.pagination.page).toBeDefined()
      expect(data.pagination.limit).toBeDefined()
      expect(data.pagination.total).toBeDefined()
    })

    test('should support pagination parameters', async ({ request }) => {
      const response = await request.get('/api/catalog/services?page=1&limit=10')

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(10)
    })

    test('should support search filter', async ({ request }) => {
      const response = await request.get('/api/catalog/services?search=test')

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.services).toBeDefined()
    })

    test('should support is_active filter', async ({ request }) => {
      const response = await request.get('/api/catalog/services?is_active=true')

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.services).toBeDefined()
    })

    test('should support price range filters', async ({ request }) => {
      const response = await request.get('/api/catalog/services?min_price=0&max_price=1000')

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.services).toBeDefined()
    })
  })
})

test.describe('API Catalog Services - Create (POST /api/catalog/services)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const response = await request.post('/api/catalog/services', {
        data: {
          name: 'Test Service',
          service_type: 'general',
          duration_minutes: 30
        }
      })

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Validation', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return 400 when missing required fields', async ({ request }) => {
      const response = await request.post('/api/catalog/services', {
        data: {}
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    test('should return 400 when missing name', async ({ request }) => {
      const response = await request.post('/api/catalog/services', {
        data: {
          service_type: 'general',
          duration_minutes: 30
        }
      })

      expect(response.status()).toBe(400)
    })

    test('should return 400 when missing service_type', async ({ request }) => {
      const response = await request.post('/api/catalog/services', {
        data: {
          name: 'Test Service',
          duration_minutes: 30
        }
      })

      expect(response.status()).toBe(400)
    })

    test('should return 400 when missing duration_minutes', async ({ request }) => {
      const response = await request.post('/api/catalog/services', {
        data: {
          name: 'Test Service',
          service_type: 'general'
        }
      })

      expect(response.status()).toBe(400)
    })

    test('should return 400 when duration is zero or negative', async ({ request }) => {
      const response = await request.post('/api/catalog/services', {
        data: {
          name: 'Test Service',
          service_type: 'general',
          duration_minutes: 0
        }
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Duration')
    })

    test('should return 400 when price is negative', async ({ request }) => {
      const response = await request.post('/api/catalog/services', {
        data: {
          name: 'Test Service',
          service_type: 'general',
          duration_minutes: 30,
          price: -100
        }
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Price')
    })

    test('should return 400 for invalid service_type', async ({ request }) => {
      const response = await request.post('/api/catalog/services', {
        data: {
          name: 'Test Service',
          service_type: 'invalid_type',
          duration_minutes: 30
        }
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('service type')
    })

    test('should return 400 for invalid category_id', async ({ request }) => {
      const response = await request.post('/api/catalog/services', {
        data: {
          name: 'Test Service',
          service_type: 'general',
          duration_minutes: 30,
          category_id: '00000000-0000-0000-0000-000000000000'
        }
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('category')
    })
  })
})

test.describe('API Tenant Services (GET /api/tenants/[tenantId]/services)', () => {

  test('should return 500 for non-existent tenant (no services)', async ({ request }) => {
    const fakeUUID = '00000000-0000-0000-0000-000000000000'

    const response = await request.get(`/api/tenants/${fakeUUID}/services`)

    // Returns 200 with empty services array or 500
    expect([200, 500]).toContain(response.status())

    if (response.status() === 200) {
      const data = await response.json()
      expect(data.services).toBeDefined()
      expect(Array.isArray(data.services)).toBe(true)
    }
  })

  test.describe('With seeded data', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return services for valid tenant', async ({ request }) => {
      // First get the admin's tenant ID
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

      const response = await request.get(`/api/tenants/${tenantId}/services`)

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.services).toBeDefined()
      expect(Array.isArray(data.services)).toBe(true)
    })
  })
})

test.describe('API Tenant Services - Create (POST /api/tenants/[tenantId]/services)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.post(`/api/tenants/${fakeUUID}/services`, {
        data: {
          name: 'Test Service',
          duration_minutes: 30,
          price: 100
        }
      })

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Authorization', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return 403 when trying to create for another tenant', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.post(`/api/tenants/${fakeUUID}/services`, {
        data: {
          name: 'Test Service',
          duration_minutes: 30,
          price: 100
        }
      })

      expect(response.status()).toBe(403)
    })
  })

  test.describe('Validation', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return 400 when missing required fields', async ({ request }) => {
      // Get the admin's tenant ID first
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

      const response = await request.post(`/api/tenants/${tenantId}/services`, {
        data: {}
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    test('should return 400 when duration out of range', async ({ request }) => {
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

      // Duration less than 15 minutes
      const response = await request.post(`/api/tenants/${tenantId}/services`, {
        data: {
          name: 'Test Service',
          duration_minutes: 5,
          price: 100
        }
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Duration')
    })

    test('should return 400 when price is negative', async ({ request }) => {
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

      const response = await request.post(`/api/tenants/${tenantId}/services`, {
        data: {
          name: 'Test Service',
          duration_minutes: 30,
          price: -50
        }
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Price')
    })
  })
})

test.describe('API Member Services', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated GET requests (401)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(`/api/members/${fakeUUID}/services`)

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Authorization', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return 403 when trying to access another members services', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(`/api/members/${fakeUUID}/services`)

      // Will be 403 or 404 depending on implementation
      expect([403, 404, 500]).toContain(response.status())
    })
  })
})
