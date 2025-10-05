import { describe, it, expect } from 'vitest'

/**
 * Vital Signs Validation Utility Functions
 */

interface VitalRange {
  min: number
  max: number
  unit: string
  label: string
}

const VITAL_RANGES: Record<string, VitalRange> = {
  temperature: { min: 36.1, max: 37.2, unit: '°C', label: 'Temperatura' },
  heart_rate: { min: 60, max: 100, unit: 'bpm', label: 'Frecuencia Cardíaca' },
  blood_pressure_systolic: { min: 90, max: 120, unit: 'mmHg', label: 'Presión Sistólica' },
  blood_pressure_diastolic: { min: 60, max: 80, unit: 'mmHg', label: 'Presión Diastólica' },
  respiratory_rate: { min: 12, max: 20, unit: 'rpm', label: 'Frecuencia Respiratoria' },
  oxygen_saturation: { min: 95, max: 100, unit: '%', label: 'Saturación O₂' },
  weight: { min: 40, max: 200, unit: 'kg', label: 'Peso' },
  height: { min: 140, max: 220, unit: 'cm', label: 'Altura' }
}

export function validateVitalSign(field: string, value: number): string | null {
  const range = VITAL_RANGES[field]
  if (!range) return null

  if (value < range.min) {
    return `⚠️ Valor bajo - Rango normal: ${range.min}-${range.max}${range.unit}`
  }
  if (value > range.max) {
    return `⚠️ Valor alto - Rango normal: ${range.min}-${range.max}${range.unit}`
  }
  return null
}

export function isVitalSignInRange(field: string, value: number): boolean {
  const range = VITAL_RANGES[field]
  if (!range) return true
  return value >= range.min && value <= range.max
}

/**
 * Unit Tests
 */

describe('Vital Signs Validation', () => {
  describe('Temperature Validation', () => {
    it('should return null for normal temperature', () => {
      expect(validateVitalSign('temperature', 36.5)).toBeNull()
      expect(validateVitalSign('temperature', 36.1)).toBeNull()
      expect(validateVitalSign('temperature', 37.2)).toBeNull()
    })

    it('should warn for high temperature', () => {
      const result = validateVitalSign('temperature', 38.5)
      expect(result).toContain('⚠️ Valor alto')
      expect(result).toContain('36.1-37.2')
    })

    it('should warn for low temperature', () => {
      const result = validateVitalSign('temperature', 35.0)
      expect(result).toContain('⚠️ Valor bajo')
      expect(result).toContain('36.1-37.2')
    })
  })

  describe('Heart Rate Validation', () => {
    it('should return null for normal heart rate', () => {
      expect(validateVitalSign('heart_rate', 72)).toBeNull()
      expect(validateVitalSign('heart_rate', 60)).toBeNull()
      expect(validateVitalSign('heart_rate', 100)).toBeNull()
    })

    it('should warn for high heart rate', () => {
      const result = validateVitalSign('heart_rate', 120)
      expect(result).toContain('⚠️ Valor alto')
      expect(result).toContain('60-100')
    })

    it('should warn for low heart rate', () => {
      const result = validateVitalSign('heart_rate', 50)
      expect(result).toContain('⚠️ Valor bajo')
      expect(result).toContain('60-100')
    })
  })

  describe('Blood Pressure Validation', () => {
    it('should return null for normal systolic pressure', () => {
      expect(validateVitalSign('blood_pressure_systolic', 110)).toBeNull()
      expect(validateVitalSign('blood_pressure_systolic', 90)).toBeNull()
      expect(validateVitalSign('blood_pressure_systolic', 120)).toBeNull()
    })

    it('should warn for high systolic pressure', () => {
      const result = validateVitalSign('blood_pressure_systolic', 140)
      expect(result).toContain('⚠️ Valor alto')
      expect(result).toContain('90-120')
    })

    it('should return null for normal diastolic pressure', () => {
      expect(validateVitalSign('blood_pressure_diastolic', 70)).toBeNull()
      expect(validateVitalSign('blood_pressure_diastolic', 60)).toBeNull()
      expect(validateVitalSign('blood_pressure_diastolic', 80)).toBeNull()
    })

    it('should warn for high diastolic pressure', () => {
      const result = validateVitalSign('blood_pressure_diastolic', 95)
      expect(result).toContain('⚠️ Valor alto')
      expect(result).toContain('60-80')
    })
  })

  describe('Oxygen Saturation Validation', () => {
    it('should return null for normal oxygen saturation', () => {
      expect(validateVitalSign('oxygen_saturation', 98)).toBeNull()
      expect(validateVitalSign('oxygen_saturation', 95)).toBeNull()
      expect(validateVitalSign('oxygen_saturation', 100)).toBeNull()
    })

    it('should warn for low oxygen saturation', () => {
      const result = validateVitalSign('oxygen_saturation', 90)
      expect(result).toContain('⚠️ Valor bajo')
      expect(result).toContain('95-100')
    })
  })

  describe('Respiratory Rate Validation', () => {
    it('should return null for normal respiratory rate', () => {
      expect(validateVitalSign('respiratory_rate', 16)).toBeNull()
      expect(validateVitalSign('respiratory_rate', 12)).toBeNull()
      expect(validateVitalSign('respiratory_rate', 20)).toBeNull()
    })

    it('should warn for high respiratory rate', () => {
      const result = validateVitalSign('respiratory_rate', 25)
      expect(result).toContain('⚠️ Valor alto')
    })

    it('should warn for low respiratory rate', () => {
      const result = validateVitalSign('respiratory_rate', 10)
      expect(result).toContain('⚠️ Valor bajo')
    })
  })

  describe('isVitalSignInRange', () => {
    it('should return true for values in range', () => {
      expect(isVitalSignInRange('temperature', 36.5)).toBe(true)
      expect(isVitalSignInRange('heart_rate', 72)).toBe(true)
    })

    it('should return false for values out of range', () => {
      expect(isVitalSignInRange('temperature', 38.5)).toBe(false)
      expect(isVitalSignInRange('heart_rate', 120)).toBe(false)
    })

    it('should return true for unknown fields', () => {
      expect(isVitalSignInRange('unknown_field', 100)).toBe(true)
    })
  })
})
