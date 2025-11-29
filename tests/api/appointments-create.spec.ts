/**
 * VT-267: Test API de creación de citas
 *
 * Tests for POST /api/appointments endpoint
 * Validates appointment creation, field validation, and conflict detection
 */
import { test, expect, APIRequestContext } from '@playwright/test'
import { createAppointmentData, getFutureDate, getRandomPatientEmail, TestContext } from '../fixtures/test-data'

test.describe('API Appointments - Create (POST /api/appointments)', () => {
  let testContext: TestContext | null = null
  let setupError: string | null = null

  test.beforeAll(async ({ request }) => {
    try {
      // Login to get authentication
      const loginResponse = await request.post('/api/auth/login', {
        data: {
          email: 'admin@clinicasanrafael.com',
          password: 'password123'
        }
      })

      if (!loginResponse.ok()) {
        setupError = 'Failed to login as admin'
        return
      }

      // Fetch valid test data from the database
      testContext = await fetchTestContext(request)
    } catch (error) {
      setupError = error instanceof Error ? error.message : 'Unknown setup error'
      console.warn('Test setup warning:', setupError)
    }
  })

  test.describe('Validation Errors (400) - No data required', () => {
    test('should reject empty body', async ({ request }) => {
      const response = await request.post('/api/appointments', {
        data: {}
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Missing required fields')
    })

    test('should reject both doctor_id and member_id', async ({ request }) => {
      const appointmentData = {
        tenant_id: 'test-tenant',
        doctor_id: 'test-doctor',
        member_id: 'test-member',
        service_id: 'test-service',
        appointment_date: getFutureDate(7),
        start_time: '10:00',
        patient_first_name: 'Test',
        patient_last_name: 'Patient',
        patient_email: getRandomPatientEmail()
      }

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Cannot specify both doctor_id and member_id')
    })

    test('should reject missing required fields - tenant_id', async ({ request }) => {
      const appointmentData = {
        doctor_id: 'test-doctor',
        service_id: 'test-service',
        appointment_date: getFutureDate(7),
        start_time: '10:00',
        patient_first_name: 'Test',
        patient_last_name: 'Patient',
        patient_email: getRandomPatientEmail()
      }

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing required fields')
    })

    test('should reject missing required fields - doctor_id and member_id', async ({ request }) => {
      const appointmentData = {
        tenant_id: 'test-tenant',
        service_id: 'test-service',
        appointment_date: getFutureDate(7),
        start_time: '10:00',
        patient_first_name: 'Test',
        patient_last_name: 'Patient',
        patient_email: getRandomPatientEmail()
      }

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('doctor_id or member_id')
    })

    test('should reject missing required fields - service_id', async ({ request }) => {
      const appointmentData = {
        tenant_id: 'test-tenant',
        doctor_id: 'test-doctor',
        appointment_date: getFutureDate(7),
        start_time: '10:00',
        patient_first_name: 'Test',
        patient_last_name: 'Patient',
        patient_email: getRandomPatientEmail()
      }

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('Missing required fields')
    })

    test('should reject missing required fields - appointment_date', async ({ request }) => {
      const appointmentData = {
        tenant_id: 'test-tenant',
        doctor_id: 'test-doctor',
        service_id: 'test-service',
        start_time: '10:00',
        patient_first_name: 'Test',
        patient_last_name: 'Patient',
        patient_email: getRandomPatientEmail()
      }

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(400)
    })

    test('should reject missing required fields - start_time', async ({ request }) => {
      const appointmentData = {
        tenant_id: 'test-tenant',
        doctor_id: 'test-doctor',
        service_id: 'test-service',
        appointment_date: getFutureDate(7),
        patient_first_name: 'Test',
        patient_last_name: 'Patient',
        patient_email: getRandomPatientEmail()
      }

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(400)
    })

    test('should reject missing required fields - patient_first_name', async ({ request }) => {
      const appointmentData = {
        tenant_id: 'test-tenant',
        doctor_id: 'test-doctor',
        service_id: 'test-service',
        appointment_date: getFutureDate(7),
        start_time: '10:00',
        patient_last_name: 'Patient',
        patient_email: getRandomPatientEmail()
      }

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(400)
    })

    test('should reject missing required fields - patient_last_name', async ({ request }) => {
      const appointmentData = {
        tenant_id: 'test-tenant',
        doctor_id: 'test-doctor',
        service_id: 'test-service',
        appointment_date: getFutureDate(7),
        start_time: '10:00',
        patient_first_name: 'Test',
        patient_email: getRandomPatientEmail()
      }

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(400)
    })

    test('should reject missing required fields - patient_email', async ({ request }) => {
      const appointmentData = {
        tenant_id: 'test-tenant',
        doctor_id: 'test-doctor',
        service_id: 'test-service',
        appointment_date: getFutureDate(7),
        start_time: '10:00',
        patient_first_name: 'Test',
        patient_last_name: 'Patient'
      }

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(400)
    })
  })

  test.describe('Not Found Errors (404)', () => {
    test('should reject non-existent service_id', async ({ request }) => {
      test.skip(!testContext, 'Skipping: No valid test data available')

      const appointmentData = createAppointmentData({
        tenant_id: testContext!.tenantId,
        doctor_id: testContext!.doctorId,
        service_id: '00000000-0000-0000-0000-000000000000',
        patient_email: getRandomPatientEmail()
      })

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(404)

      const data = await response.json()
      expect(data.error).toContain('Service not found')
    })
  })

  test.describe('Successful Creation (requires seeded data)', () => {
    test('should create appointment with valid data (201)', async ({ request }) => {
      test.skip(!testContext, 'Skipping: No valid test data available. Please seed the database.')

      const appointmentData = createAppointmentData({
        tenant_id: testContext!.tenantId,
        doctor_id: testContext!.doctorId,
        service_id: testContext!.serviceId,
        appointment_date: getFutureDate(14),
        start_time: '09:00',
        patient_email: getRandomPatientEmail()
      })

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(201)

      const data = await response.json()
      expect(data.id).toBeDefined()
      expect(data.tenant_id).toBe(testContext!.tenantId)
      expect(data.status).toBe('pending')
      expect(data.payment_status).toBe('pending')
    })

    test('should create appointment and return related data', async ({ request }) => {
      test.skip(!testContext, 'Skipping: No valid test data available')

      const appointmentData = createAppointmentData({
        tenant_id: testContext!.tenantId,
        doctor_id: testContext!.doctorId,
        service_id: testContext!.serviceId,
        appointment_date: getFutureDate(15),
        start_time: '11:00',
        patient_email: getRandomPatientEmail()
      })

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(201)

      const data = await response.json()
      expect(data.tenant).toBeDefined()
      expect(data.service).toBeDefined()
      expect(data.patient).toBeDefined()
    })

    test('should calculate end_time based on service duration', async ({ request }) => {
      test.skip(!testContext, 'Skipping: No valid test data available')

      const appointmentData = createAppointmentData({
        tenant_id: testContext!.tenantId,
        doctor_id: testContext!.doctorId,
        service_id: testContext!.serviceId,
        appointment_date: getFutureDate(16),
        start_time: '14:00',
        patient_email: getRandomPatientEmail()
      })

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(201)

      const data = await response.json()
      expect(data.start_time).toBe('14:00')
      expect(data.end_time).toBeDefined()
      expect(data.end_time > data.start_time).toBeTruthy()
    })

    test('should create new patient if not exists', async ({ request }) => {
      test.skip(!testContext, 'Skipping: No valid test data available')

      const uniqueEmail = getRandomPatientEmail()
      const appointmentData = createAppointmentData({
        tenant_id: testContext!.tenantId,
        doctor_id: testContext!.doctorId,
        service_id: testContext!.serviceId,
        appointment_date: getFutureDate(17),
        start_time: '15:00',
        patient_first_name: 'Nuevo',
        patient_last_name: 'Paciente',
        patient_email: uniqueEmail
      })

      const response = await request.post('/api/appointments', {
        data: appointmentData
      })

      expect(response.status()).toBe(201)

      const data = await response.json()
      expect(data.patient).toBeDefined()
      expect(data.patient.email).toBe(uniqueEmail)
      expect(data.patient.first_name).toBe('Nuevo')
      expect(data.patient.last_name).toBe('Paciente')
    })
  })

  test.describe('Conflict Errors (409)', () => {
    test('should reject double booking for same doctor/time', async ({ request }) => {
      test.skip(!testContext, 'Skipping: No valid test data available')

      const appointmentDate = getFutureDate(30)
      const startTime = '16:00'
      const uniqueEmail1 = getRandomPatientEmail()
      const uniqueEmail2 = getRandomPatientEmail()

      const firstAppointment = createAppointmentData({
        tenant_id: testContext!.tenantId,
        doctor_id: testContext!.doctorId,
        service_id: testContext!.serviceId,
        appointment_date: appointmentDate,
        start_time: startTime,
        patient_email: uniqueEmail1
      })

      const firstResponse = await request.post('/api/appointments', {
        data: firstAppointment
      })

      expect(firstResponse.status()).toBe(201)

      const secondAppointment = createAppointmentData({
        tenant_id: testContext!.tenantId,
        doctor_id: testContext!.doctorId,
        service_id: testContext!.serviceId,
        appointment_date: appointmentDate,
        start_time: startTime,
        patient_email: uniqueEmail2
      })

      const secondResponse = await request.post('/api/appointments', {
        data: secondAppointment
      })

      expect(secondResponse.status()).toBe(409)

      const data = await secondResponse.json()
      expect(data.error).toContain('Time slot is no longer available')
    })
  })
})

/**
 * Helper function to fetch valid test context from the database
 * Returns null if no valid data found instead of throwing
 */
async function fetchTestContext(request: APIRequestContext): Promise<TestContext | null> {
  try {
    const meResponse = await request.get('/api/auth/me')

    if (!meResponse.ok()) {
      console.warn('Failed to get user profile')
      return null
    }

    const meData = await meResponse.json()
    const tenantId = meData.user?.profile?.tenant_id

    if (!tenantId) {
      console.warn('User profile does not have a tenant_id')
      return null
    }

    const servicesResponse = await request.get(`/api/tenants/${tenantId}/services`)

    if (!servicesResponse.ok()) {
      console.warn(`Failed to fetch services for tenant ${tenantId}`)
      return null
    }

    const servicesData = await servicesResponse.json()

    if (!servicesData.services || servicesData.services.length === 0) {
      console.warn(`No services found for tenant ${tenantId}`)
      return null
    }

    const serviceId = servicesData.services[0].id

    const doctorsResponse = await request.get(`/api/tenants/${tenantId}/doctors`)

    if (!doctorsResponse.ok()) {
      console.warn(`Failed to fetch doctors for tenant ${tenantId}`)
      return null
    }

    const doctorsData = await doctorsResponse.json()

    if (!doctorsData.doctors || doctorsData.doctors.length === 0) {
      console.warn(`No doctors found for tenant ${tenantId}`)
      return null
    }

    const doctorId = doctorsData.doctors[0].id

    console.log(`Test context ready: tenant=${tenantId}, service=${serviceId}, doctor=${doctorId}`)

    return {
      tenantId,
      doctorId,
      serviceId
    }
  } catch (error) {
    console.warn('Error fetching test context:', error)
    return null
  }
}
