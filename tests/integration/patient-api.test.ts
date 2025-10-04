/**
 * INTEGRATION TESTS - Patient API Endpoints
 * Tests for Patient CRUD API operations with database integration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const API_BASE = `${BASE_URL}/api`

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
  document: string
  phone?: string
  date_of_birth?: string
  address?: string
  medical_history?: string
  is_active: boolean
  tenant_id: string
  created_at: string
  updated_at: string
}

// Test data
const testPatient = {
  first_name: 'Integration',
  last_name: 'Test',
  email: `integration.test.${Date.now()}@example.com`,
  document: `TEST-${Date.now()}`,
  phone: '+51 987654321',
  date_of_birth: '1990-01-01',
  address: 'Test Address 123',
  medical_history: 'No medical history'
}

let authCookie: string
let createdPatientId: string
let tenantId: string

describe('Patient API Integration Tests', () => {
  beforeAll(async () => {
    // Login to get authentication cookie
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@clinicasanrafael.com',
        password: 'password'
      })
    })

    const setCookieHeader = loginResponse.headers.get('set-cookie')
    if (setCookieHeader) {
      authCookie = setCookieHeader
    }

    // Get tenant ID from user profile
    const meResponse = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Cookie': authCookie
      }
    })
    const userData = await meResponse.json()
    tenantId = userData.profile?.tenant_id
  })

  describe('POST /api/patients - Create Patient', () => {
    it('should create a new patient with all required fields', async () => {
      const response = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(testPatient)
      })

      expect(response.status).toBe(200)

      const data = await response.json() as Patient
      expect(data).toHaveProperty('id')
      expect(data.first_name).toBe(testPatient.first_name)
      expect(data.last_name).toBe(testPatient.last_name)
      expect(data.email).toBe(testPatient.email)
      expect(data.document).toBe(testPatient.document)
      expect(data.phone).toBe(testPatient.phone)
      expect(data.is_active).toBe(true)

      createdPatientId = data.id
    })

    it('should fail when document field is missing', async () => {
      const invalidPatient = {
        first_name: 'Missing',
        last_name: 'Document',
        email: 'missing.doc@example.com'
        // document is missing
      }

      const response = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(invalidPatient)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('document')
    })

    it('should fail when first_name is missing', async () => {
      const invalidPatient = {
        last_name: 'Test',
        email: 'test@example.com',
        document: 'DOC123'
      }

      const response = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(invalidPatient)
      })

      expect(response.status).toBe(400)
    })

    it('should fail when email is missing', async () => {
      const invalidPatient = {
        first_name: 'Test',
        last_name: 'User',
        document: 'DOC123'
      }

      const response = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(invalidPatient)
      })

      expect(response.status).toBe(400)
    })

    it('should fail when unauthorized', async () => {
      const response = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No auth cookie
        },
        body: JSON.stringify(testPatient)
      })

      expect(response.status).toBe(401)
    })

    it('should prevent duplicate email in same tenant', async () => {
      // Try to create patient with same email
      const duplicatePatient = {
        ...testPatient,
        document: 'DIFF-DOC-123' // Different document
      }

      const response = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(duplicatePatient)
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('email already exists')
    })
  })

  describe('GET /api/patients - List Patients', () => {
    it('should return list of patients for authenticated user', async () => {
      const response = await fetch(`${API_BASE}/patients`, {
        headers: {
          'Cookie': authCookie
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)

      // Verify patient structure includes document field
      const patient = data[0]
      expect(patient).toHaveProperty('id')
      expect(patient).toHaveProperty('first_name')
      expect(patient).toHaveProperty('document')
      expect(patient).toHaveProperty('email')
    })

    it('should filter patients by tenant', async () => {
      const response = await fetch(`${API_BASE}/patients?tenantId=${tenantId}`, {
        headers: {
          'Cookie': authCookie
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      // All patients should belong to the same tenant
      data.forEach((patient: Patient) => {
        expect(patient.tenant_id).toBe(tenantId)
      })
    })

    it('should fail when unauthorized', async () => {
      const response = await fetch(`${API_BASE}/patients`)
      expect(response.status).toBe(401)
    })
  })

  describe('GET /api/patients/[patientId] - Get Patient', () => {
    it('should return patient by ID', async () => {
      const response = await fetch(`${API_BASE}/patients/${createdPatientId}`, {
        headers: {
          'Cookie': authCookie
        }
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.id).toBe(createdPatientId)
      expect(data.document).toBe(testPatient.document)
      expect(data.email).toBe(testPatient.email)
    })

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const response = await fetch(`${API_BASE}/patients/${fakeId}`, {
        headers: {
          'Cookie': authCookie
        }
      })

      expect(response.status).toBe(404)
    })

    it('should fail when unauthorized', async () => {
      const response = await fetch(`${API_BASE}/patients/${createdPatientId}`)
      expect(response.status).toBe(401)
    })
  })

  describe('PUT /api/patients/[patientId] - Update Patient', () => {
    it('should update patient data including document', async () => {
      const updates = {
        first_name: 'Updated',
        document: 'UPDATED-DOC-456',
        phone: '+51 999888777'
      }

      const response = await fetch(`${API_BASE}/patients/${createdPatientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(updates)
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.first_name).toBe(updates.first_name)
      expect(data.document).toBe(updates.document)
      expect(data.phone).toBe(updates.phone)
    })

    it('should update patient status', async () => {
      const response = await fetch(`${API_BASE}/patients/${createdPatientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({ is_active: false })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.is_active).toBe(false)
    })

    it('should fail to update non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const response = await fetch(`${API_BASE}/patients/${fakeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({ first_name: 'Test' })
      })

      expect(response.status).toBe(404)
    })

    it('should fail when unauthorized', async () => {
      const response = await fetch(`${API_BASE}/patients/${createdPatientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ first_name: 'Test' })
      })

      expect(response.status).toBe(401)
    })

    it('should reject update with no valid fields', async () => {
      const response = await fetch(`${API_BASE}/patients/${createdPatientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({ invalid_field: 'test' })
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Search and Filter', () => {
    it('should support searching by document number', async () => {
      const response = await fetch(`${API_BASE}/patients`, {
        headers: {
          'Cookie': authCookie
        }
      })

      const patients = await response.json()
      const patientWithDoc = patients.find((p: Patient) =>
        p.document && p.document.includes('UPDATED-DOC')
      )

      expect(patientWithDoc).toBeDefined()
      expect(patientWithDoc?.document).toContain('UPDATED-DOC')
    })
  })

  describe('Data Integrity', () => {
    it('should preserve document field through create-update cycle', async () => {
      // Create
      const newPatient = {
        first_name: 'Integrity',
        last_name: 'Test',
        email: `integrity.${Date.now()}@test.com`,
        document: `INTEGRITY-${Date.now()}`
      }

      const createResponse = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(newPatient)
      })

      const created = await createResponse.json()
      expect(created.document).toBe(newPatient.document)

      // Update
      const updateResponse = await fetch(`${API_BASE}/patients/${created.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({ phone: '+51 999999999' })
      })

      const updated = await updateResponse.json()
      expect(updated.document).toBe(newPatient.document) // Should preserve document
      expect(updated.phone).toBe('+51 999999999')
    })
  })

  afterAll(async () => {
    // Cleanup: deactivate test patient
    if (createdPatientId) {
      await fetch(`${API_BASE}/patients/${createdPatientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({ is_active: false })
      })
    }
  })
})
