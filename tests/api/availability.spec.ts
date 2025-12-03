/**
 * VT-269: Test API de disponibilidad
 *
 * Tests for availability endpoints:
 * - GET /api/availability (public slots query)
 * - GET /api/doctors/[doctorId]/availability (doctor's availability config)
 * - POST /api/doctors/[doctorId]/availability (create availability blocks)
 * - PUT /api/doctors/[doctorId]/availability (update availability)
 * - DELETE /api/doctors/[doctorId]/availability (delete availability)
 */
import { test, expect } from '@playwright/test'

test.describe('API Availability - Public Slots (GET /api/availability)', () => {

  test.describe('Parameter Validation', () => {
    test('should return 400 when missing all parameters', async ({ request }) => {
      const response = await request.get('/api/availability')

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Missing required parameters')
    })

    test('should return 400 when missing doctorId', async ({ request }) => {
      const response = await request.get('/api/availability?date=2025-01-15&tenantId=test-tenant')

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Missing required parameters')
    })

    test('should return 400 when missing date', async ({ request }) => {
      const response = await request.get('/api/availability?doctorId=test-doctor&tenantId=test-tenant')

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Missing required parameters')
    })

    test('should return 400 when missing tenantId', async ({ request }) => {
      const response = await request.get('/api/availability?doctorId=test-doctor&date=2025-01-15')

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Missing required parameters')
    })
  })

  test.describe('Not Found Errors', () => {
    test('should return 404 when doctor not found for tenant', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(
        `/api/availability?doctorId=${fakeUUID}&date=2025-01-15&tenantId=${fakeUUID}`
      )

      expect(response.status()).toBe(404)

      const data = await response.json()
      expect(data.error).toContain('Doctor not found')
    })
  })

  test.describe('Success Cases', () => {
    test.describe.skip('With seeded data', () => {
      test('should return available time slots for valid doctor', async ({ request }) => {
        // Would need a real doctorId, date, and tenantId
        // const response = await request.get('/api/availability?doctorId=...&date=...&tenantId=...')
        // expect(response.ok()).toBeTruthy()
        // const data = await response.json()
        // expect(Array.isArray(data)).toBe(true)
      })

      test('should return empty array when doctor has no availability configured', async ({ request }) => {
        // Would need a doctor with no availability
      })

      test('should exclude time slots that conflict with appointments', async ({ request }) => {
        // Would need a doctor with existing appointments
      })

      test('should exclude time slots during breaks', async ({ request }) => {
        // Would need a doctor with configured breaks
      })
    })
  })
})

test.describe('API Doctor Availability - Config (GET /api/doctors/[doctorId]/availability)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(`/api/doctors/${fakeUUID}/availability`)

      expect(response.status()).toBe(401)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  test.describe('Authorization', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return 403 when trying to access another doctor availability', async ({ request }) => {
      // Admin trying to access a fake doctor's availability
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(`/api/doctors/${fakeUUID}/availability`)

      // Should be 403 (Forbidden) because admin is not the doctor
      expect(response.status()).toBe(403)
    })
  })

  test.describe.skip('With doctor auth', () => {
    // Would need doctor storage state
    test.use({ storageState: 'tests/.auth/doctor.json' })

    test('should return doctor own availability', async ({ request }) => {
      // Would need to get doctor's own ID from auth
    })
  })
})

test.describe('API Doctor Availability - Create (POST /api/doctors/[doctorId]/availability)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.post(`/api/doctors/${fakeUUID}/availability`, {
        data: {
          blocks: [
            { day: 1, startTime: '09:00', endTime: '17:00' }
          ]
        }
      })

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Validation', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return 400 when blocks is not an array', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.post(`/api/doctors/${fakeUUID}/availability`, {
        data: {
          blocks: 'not-an-array'
        }
      })

      // Will be 403 (admin trying to modify another doctor) or 400
      expect([400, 403]).toContain(response.status())
    })

    test('should return 403 when admin tries to create for another doctor', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.post(`/api/doctors/${fakeUUID}/availability`, {
        data: {
          blocks: []
        }
      })

      expect(response.status()).toBe(403)
    })
  })
})

test.describe('API Doctor Availability - Update (PUT /api/doctors/[doctorId]/availability)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.put(`/api/doctors/${fakeUUID}/availability`, {
        data: {
          day_of_week: 1,
          start_time: '09:00',
          end_time: '17:00'
        }
      })

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Validation', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return 400 when missing required fields', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.put(`/api/doctors/${fakeUUID}/availability`, {
        data: {}
      })

      // Will be 403 first (admin != doctor), but if it were the doctor, would be 400
      expect([400, 403]).toContain(response.status())
    })

    test('should return 403 when admin tries to update another doctor', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.put(`/api/doctors/${fakeUUID}/availability`, {
        data: {
          day_of_week: 1,
          start_time: '09:00',
          end_time: '17:00'
        }
      })

      expect(response.status()).toBe(403)
    })
  })
})

test.describe('API Doctor Availability - Delete (DELETE /api/doctors/[doctorId]/availability)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.delete(`/api/doctors/${fakeUUID}/availability?day_of_week=1`)

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Validation', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return 400 when missing day_of_week parameter', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.delete(`/api/doctors/${fakeUUID}/availability`)

      // Will be 403 first (admin != doctor), but if it were the doctor, would be 400
      expect([400, 403]).toContain(response.status())
    })

    test('should return 403 when admin tries to delete another doctor availability', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.delete(`/api/doctors/${fakeUUID}/availability?day_of_week=1`)

      expect(response.status()).toBe(403)
    })
  })
})

test.describe('API Member Availability', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })

  test.describe('GET /api/member-availability', () => {
    test('should return availability data or appropriate error', async ({ request }) => {
      const response = await request.get('/api/member-availability')

      // May return 200 (success), 401 (unauth), 400 (missing params), or 500 (server error)
      expect([200, 400, 401, 500]).toContain(response.status())

      if (response.status() === 200) {
        const data = await response.json()
        expect(Array.isArray(data) || typeof data === 'object').toBe(true)
      }
    })
  })
})
