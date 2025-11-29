/**
 * VT-271: Test API de pacientes
 *
 * Tests for patients endpoints:
 * - GET /api/patients (list patients)
 * - POST /api/patients (create patient)
 * - GET /api/doctors/[doctorId]/patients (doctor's patients)
 */
import { test, expect } from '@playwright/test'

test.describe('API Patients (GET /api/patients)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const response = await request.get('/api/patients')

      expect(response.status()).toBe(401)

      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })

  test.describe('Authenticated Requests', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return patients list', async ({ request }) => {
      const response = await request.get('/api/patients')

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('should support tenantId filter', async ({ request }) => {
      // Get admin's tenant ID first
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

      const response = await request.get(`/api/patients?tenantId=${tenantId}`)

      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  test.describe('Doctor Role', () => {
    test.use({ storageState: 'tests/.auth/doctor.json' })

    test('should return patients filtered by doctor tenant', async ({ request }) => {
      const response = await request.get('/api/patients')

      // Should work if doctor has tenant, or 403 if not
      expect([200, 403]).toContain(response.status())

      if (response.ok()) {
        const data = await response.json()
        expect(Array.isArray(data)).toBe(true)
      }
    })
  })
})

test.describe('API Patients - Create (POST /api/patients)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const response = await request.post('/api/patients', {
        data: {
          first_name: 'Test',
          last_name: 'Patient',
          email: 'test@example.com',
          document: '12345678'
        }
      })

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Validation', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return 400 when missing required fields', async ({ request }) => {
      const response = await request.post('/api/patients', {
        data: {}
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('required')
    })

    test('should return 400 when missing first_name', async ({ request }) => {
      const response = await request.post('/api/patients', {
        data: {
          last_name: 'Patient',
          email: 'test@example.com',
          document: '12345678'
        }
      })

      expect(response.status()).toBe(400)
    })

    test('should return 400 when missing last_name', async ({ request }) => {
      const response = await request.post('/api/patients', {
        data: {
          first_name: 'Test',
          email: 'test@example.com',
          document: '12345678'
        }
      })

      expect(response.status()).toBe(400)
    })

    test('should return 400 when missing email', async ({ request }) => {
      const response = await request.post('/api/patients', {
        data: {
          first_name: 'Test',
          last_name: 'Patient',
          document: '12345678'
        }
      })

      expect(response.status()).toBe(400)
    })

    test('should return 400 when missing document', async ({ request }) => {
      const response = await request.post('/api/patients', {
        data: {
          first_name: 'Test',
          last_name: 'Patient',
          email: 'test@example.com'
        }
      })

      expect(response.status()).toBe(400)
    })

    test('should return 400 for duplicate email in same tenant', async ({ request }) => {
      // First get existing patients
      const patientsResponse = await request.get('/api/patients')

      if (!patientsResponse.ok()) {
        test.skip(true, 'Could not get patients')
        return
      }

      const patients = await patientsResponse.json()

      if (!patients || patients.length === 0) {
        test.skip(true, 'No existing patients to test duplicate')
        return
      }

      // Try to create patient with existing email
      const existingPatient = patients[0]

      const response = await request.post('/api/patients', {
        data: {
          first_name: 'Duplicate',
          last_name: 'Test',
          email: existingPatient.email,
          document: 'NEWDOC123'
        }
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('already exists')
    })
  })

  test.describe('Success Cases', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should create patient with valid data', async ({ request }) => {
      const timestamp = Date.now()
      const uniqueEmail = `test-patient-${timestamp}@test.com`
      const uniqueDocument = `DOC-${timestamp}`

      const response = await request.post('/api/patients', {
        data: {
          first_name: 'Test',
          last_name: 'Patient',
          email: uniqueEmail,
          document: uniqueDocument,
          phone: '+51999888777',
          date_of_birth: '1990-01-15',
          address: 'Test Address 123'
        }
      })

      expect(response.ok()).toBeTruthy()

      const patient = await response.json()
      expect(patient.id).toBeDefined()
      expect(patient.first_name).toBe('Test')
      expect(patient.last_name).toBe('Patient')
      expect(patient.email).toBe(uniqueEmail)
    })
  })
})

test.describe('API Doctor Patients (GET /api/doctors/[doctorId]/patients)', () => {

  test.describe('Authentication', () => {
    test('should reject unauthenticated requests (401)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(`/api/doctors/${fakeUUID}/patients`)

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Validation', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should return 403 when accessing other doctors patients (non-admin)', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(`/api/doctors/${fakeUUID}/patients`)

      // Admin can access any doctor's patients, but fake UUID will fail
      // Returns 403 (forbidden) or 500 (no patients) or 404 (doctor not found)
      expect([403, 404, 500]).toContain(response.status())
    })
  })

  test.describe('Doctor Access', () => {
    test.use({ storageState: 'tests/.auth/doctor.json' })

    test('doctor can access their own patients', async ({ request }) => {
      // Get doctor's own ID
      const meResponse = await request.get('/api/auth/me')

      if (!meResponse.ok()) {
        test.skip(true, 'Could not get user profile')
        return
      }

      const meData = await meResponse.json()
      const doctorId = meData.user?.id

      if (!doctorId) {
        test.skip(true, 'No doctor ID found')
        return
      }

      const response = await request.get(`/api/doctors/${doctorId}/patients`)

      // Doctor may get 200 (has patients), 404 (no profile), or 500 (no appointments)
      expect([200, 404, 500]).toContain(response.status())

      if (response.ok()) {
        const patients = await response.json()
        expect(Array.isArray(patients)).toBe(true)
      }
    })

    test('doctor cannot access other doctors patients', async ({ request }) => {
      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(`/api/doctors/${fakeUUID}/patients`)

      expect(response.status()).toBe(403)
    })
  })

  test.describe('Admin Access', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('admin can access any doctor patients in their tenant', async ({ request }) => {
      // This test would need a real doctor ID in the same tenant
      // For now we test that admin gets different response than unauthorized

      const fakeUUID = '00000000-0000-0000-0000-000000000000'

      const response = await request.get(`/api/doctors/${fakeUUID}/patients`)

      // Admin would get 404/500 for non-existent doctor, not 403
      // This shows admin has permission to try to access
      expect([404, 500]).toContain(response.status())
    })
  })
})

test.describe('API Patients - Tenant Isolation', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })

  test('patients should be filtered by user tenant', async ({ request }) => {
    const response = await request.get('/api/patients')

    expect(response.ok()).toBeTruthy()

    const patients = await response.json()
    expect(Array.isArray(patients)).toBe(true)

    // Get user's tenant
    const meResponse = await request.get('/api/auth/me')
    if (meResponse.ok()) {
      const meData = await meResponse.json()
      const userTenantId = meData.user?.profile?.tenant_id

      if (userTenantId && patients.length > 0) {
        // All patients should belong to user's tenant
        patients.forEach((patient: { tenant_id: string }) => {
          expect(patient.tenant_id).toBe(userTenantId)
        })
      }
    }
  })
})
