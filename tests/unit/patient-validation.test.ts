/**
 * UNIT TESTS - Patient Validation
 * Tests for patient data validation logic
 */

import { describe, it, expect } from '@jest/globals'

interface PatientFormData {
  first_name: string
  last_name: string
  email: string
  document: string
  phone?: string
  date_of_birth?: string
  address?: string
  medical_history?: string
}

// Validation functions
function validatePatientData(data: PatientFormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Required fields validation
  if (!data.first_name || data.first_name.trim() === '') {
    errors.push('Nombre es requerido')
  }

  if (!data.last_name || data.last_name.trim() === '') {
    errors.push('Apellido es requerido')
  }

  if (!data.email || data.email.trim() === '') {
    errors.push('Email es requerido')
  } else if (!isValidEmail(data.email)) {
    errors.push('Email no es válido')
  }

  if (!data.document || data.document.trim() === '') {
    errors.push('Documento es requerido')
  }

  // Optional field validations
  if (data.phone && data.phone.length > 0 && !isValidPhone(data.phone)) {
    errors.push('Teléfono no es válido')
  }

  if (data.date_of_birth && !isValidDate(data.date_of_birth)) {
    errors.push('Fecha de nacimiento no es válida')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidPhone(phone: string): boolean {
  // Allow international formats with optional + and spaces/dashes
  const phoneRegex = /^\+?[\d\s\-()]{8,}$/
  return phoneRegex.test(phone)
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

function sanitizePatientData(data: PatientFormData): PatientFormData {
  return {
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    email: data.email.trim().toLowerCase(),
    document: data.document.trim(),
    phone: data.phone?.trim(),
    date_of_birth: data.date_of_birth,
    address: data.address?.trim(),
    medical_history: data.medical_history?.trim()
  }
}

describe('Patient Validation - Unit Tests', () => {
  describe('validatePatientData', () => {
    it('should validate a complete valid patient', () => {
      const validPatient: PatientFormData = {
        first_name: 'Juan',
        last_name: 'Pérez',
        email: 'juan.perez@example.com',
        document: '12345678',
        phone: '+51 987654321',
        date_of_birth: '1990-01-01',
        address: 'Av. Principal 123',
        medical_history: 'Sin antecedentes'
      }

      const result = validatePatientData(validPatient)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when first_name is missing', () => {
      const invalidPatient: PatientFormData = {
        first_name: '',
        last_name: 'Pérez',
        email: 'juan@example.com',
        document: '12345678'
      }

      const result = validatePatientData(invalidPatient)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Nombre es requerido')
    })

    it('should fail when last_name is missing', () => {
      const invalidPatient: PatientFormData = {
        first_name: 'Juan',
        last_name: '',
        email: 'juan@example.com',
        document: '12345678'
      }

      const result = validatePatientData(invalidPatient)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Apellido es requerido')
    })

    it('should fail when email is missing', () => {
      const invalidPatient: PatientFormData = {
        first_name: 'Juan',
        last_name: 'Pérez',
        email: '',
        document: '12345678'
      }

      const result = validatePatientData(invalidPatient)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Email es requerido')
    })

    it('should fail when document is missing (NEW REQUIREMENT)', () => {
      const invalidPatient: PatientFormData = {
        first_name: 'Juan',
        last_name: 'Pérez',
        email: 'juan@example.com',
        document: ''
      }

      const result = validatePatientData(invalidPatient)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Documento es requerido')
    })

    it('should fail when email format is invalid', () => {
      const invalidPatient: PatientFormData = {
        first_name: 'Juan',
        last_name: 'Pérez',
        email: 'invalid-email',
        document: '12345678'
      }

      const result = validatePatientData(invalidPatient)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Email no es válido')
    })

    it('should accept patient with only required fields', () => {
      const minimalPatient: PatientFormData = {
        first_name: 'Juan',
        last_name: 'Pérez',
        email: 'juan@example.com',
        document: 'DNI-12345678'
      }

      const result = validatePatientData(minimalPatient)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail with multiple validation errors', () => {
      const invalidPatient: PatientFormData = {
        first_name: '',
        last_name: '',
        email: 'invalid',
        document: ''
      }

      const result = validatePatientData(invalidPatient)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co')).toBe(true)
      expect(isValidEmail('user+tag@example.com')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
      expect(isValidEmail('user @example.com')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should accept valid phone numbers', () => {
      expect(isValidPhone('+51 987654321')).toBe(true)
      expect(isValidPhone('987654321')).toBe(true)
      expect(isValidPhone('+1 (555) 123-4567')).toBe(true)
      expect(isValidPhone('555-1234')).toBe(false) // Too short
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('abc')).toBe(false)
      expect(isValidPhone('123')).toBe(false) // Too short
    })
  })

  describe('isValidDate', () => {
    it('should accept valid dates', () => {
      expect(isValidDate('1990-01-01')).toBe(true)
      expect(isValidDate('2000-12-31')).toBe(true)
    })

    it('should reject invalid dates', () => {
      expect(isValidDate('invalid')).toBe(false)
      expect(isValidDate('2000-13-01')).toBe(false) // Invalid month
      expect(isValidDate('2000-02-30')).toBe(false) // Invalid day
    })
  })

  describe('sanitizePatientData', () => {
    it('should trim whitespace from all fields', () => {
      const dirtyData: PatientFormData = {
        first_name: '  Juan  ',
        last_name: '  Pérez  ',
        email: '  juan@example.com  ',
        document: '  12345678  ',
        phone: '  987654321  ',
        address: '  Av. Principal  '
      }

      const clean = sanitizePatientData(dirtyData)
      expect(clean.first_name).toBe('Juan')
      expect(clean.last_name).toBe('Pérez')
      expect(clean.email).toBe('juan@example.com')
      expect(clean.document).toBe('12345678')
      expect(clean.phone).toBe('987654321')
      expect(clean.address).toBe('Av. Principal')
    })

    it('should convert email to lowercase', () => {
      const data: PatientFormData = {
        first_name: 'Juan',
        last_name: 'Pérez',
        email: 'JUAN@EXAMPLE.COM',
        document: '12345678'
      }

      const clean = sanitizePatientData(data)
      expect(clean.email).toBe('juan@example.com')
    })

    it('should preserve document format', () => {
      const data: PatientFormData = {
        first_name: 'Juan',
        last_name: 'Pérez',
        email: 'juan@example.com',
        document: 'DNI-12345678'
      }

      const clean = sanitizePatientData(data)
      expect(clean.document).toBe('DNI-12345678')
    })
  })
})

export { validatePatientData, isValidEmail, isValidPhone, isValidDate, sanitizePatientData }
