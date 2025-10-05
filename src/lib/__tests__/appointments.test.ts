import { describe, it, expect } from 'vitest'

/**
 * Appointment Utilities
 */

export function formatTime(timeString: string, dateString?: string): string {
  // If it's just a time string (HH:MM:SS), display it directly
  if (timeString && timeString.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
    return timeString.substring(0, 5) // Return HH:MM
  }

  // If we have a date string, use it as the base
  if (dateString) {
    try {
      const date = new Date(dateString)
      const [hours, minutes] = timeString.split(':')
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10))

      if (isNaN(date.getTime())) {
        return timeString
      }

      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch (error) {
      return timeString
    }
  }

  // Fallback to just formatting the time string
  return timeString
}

export function canShowAtenderButton(userRole: string, patientId?: string): boolean {
  return userRole === 'doctor' && !!patientId
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800'
  }
  return statusColors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
    pending: 'Pendiente'
  }
  return statusLabels[status] || status
}

/**
 * Unit Tests
 */

describe('Appointment Utilities', () => {
  describe('formatTime', () => {
    it('should format HH:MM:SS time strings correctly', () => {
      expect(formatTime('14:30:00')).toBe('14:30')
      expect(formatTime('09:15:00')).toBe('09:15')
      expect(formatTime('23:45:00')).toBe('23:45')
    })

    it('should format HH:MM time strings correctly', () => {
      expect(formatTime('14:30')).toBe('14:30')
      expect(formatTime('09:15')).toBe('09:15')
    })

    it('should handle time with date string', () => {
      const result = formatTime('14:30:00', '2025-10-04')
      expect(result).toBe('14:30')
    })

    it('should return original string for invalid formats', () => {
      expect(formatTime('invalid')).toBe('invalid')
      expect(formatTime('')).toBe('')
    })

    it('should not return "Invalid Date"', () => {
      const result1 = formatTime('14:30:00')
      const result2 = formatTime('14:30:00', '2025-10-04')

      expect(result1).not.toContain('Invalid')
      expect(result2).not.toContain('Invalid')
    })
  })

  describe('canShowAtenderButton', () => {
    it('should return true for doctor with patient_id', () => {
      expect(canShowAtenderButton('doctor', 'patient-123')).toBe(true)
    })

    it('should return false for doctor without patient_id', () => {
      expect(canShowAtenderButton('doctor', undefined)).toBe(false)
      expect(canShowAtenderButton('doctor', '')).toBe(false)
    })

    it('should return false for non-doctor roles', () => {
      expect(canShowAtenderButton('admin', 'patient-123')).toBe(false)
      expect(canShowAtenderButton('patient', 'patient-123')).toBe(false)
      expect(canShowAtenderButton('staff', 'patient-123')).toBe(false)
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors for known statuses', () => {
      expect(getStatusColor('scheduled')).toBe('bg-blue-100 text-blue-800')
      expect(getStatusColor('confirmed')).toBe('bg-green-100 text-green-800')
      expect(getStatusColor('completed')).toBe('bg-gray-100 text-gray-800')
      expect(getStatusColor('cancelled')).toBe('bg-red-100 text-red-800')
      expect(getStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800')
    })

    it('should return default color for unknown status', () => {
      expect(getStatusColor('unknown')).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('getStatusLabel', () => {
    it('should return Spanish labels for known statuses', () => {
      expect(getStatusLabel('scheduled')).toBe('Programada')
      expect(getStatusLabel('confirmed')).toBe('Confirmada')
      expect(getStatusLabel('completed')).toBe('Completada')
      expect(getStatusLabel('cancelled')).toBe('Cancelada')
      expect(getStatusLabel('pending')).toBe('Pendiente')
    })

    it('should return original status for unknown status', () => {
      expect(getStatusLabel('unknown')).toBe('unknown')
    })
  })
})
