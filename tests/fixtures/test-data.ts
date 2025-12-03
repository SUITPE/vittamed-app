/**
 * Test Data Fixtures for API Tests
 * VT-267: Test data for appointment API testing
 */

export const TEST_USERS = {
  admin: {
    email: 'admin@clinicasanrafael.com',
    password: 'password123'
  },
  doctor: {
    email: 'alvaro@abp.pe',
    password: 'VittaMed2024!'
  },
  receptionist: {
    email: 'secre@clinicasanrafael.com',
    password: 'password'
  }
}

/**
 * Helper to get a future date string in YYYY-MM-DD format
 */
export function getFutureDate(daysFromNow: number = 1): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

/**
 * Helper to generate a random patient email
 */
export function getRandomPatientEmail(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `test-patient-${timestamp}-${random}@test.com`
}

/**
 * Appointment test data factory
 */
export function createAppointmentData(overrides: Partial<AppointmentInput> = {}): AppointmentInput {
  return {
    tenant_id: '', // Must be provided
    doctor_id: '', // Must be provided (or member_id)
    service_id: '', // Must be provided
    appointment_date: getFutureDate(7),
    start_time: '10:00',
    patient_first_name: 'Test',
    patient_last_name: 'Patient',
    patient_email: getRandomPatientEmail(),
    patient_phone: '+51 999 999 999',
    ...overrides
  }
}

export interface AppointmentInput {
  tenant_id: string
  doctor_id?: string
  member_id?: string
  service_id: string
  appointment_date: string
  start_time: string
  patient_first_name: string
  patient_last_name: string
  patient_email: string
  patient_phone?: string
}

export interface TestContext {
  tenantId: string
  doctorId: string
  serviceId: string
}
