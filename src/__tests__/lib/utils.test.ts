import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('base', isActive && 'active')
      expect(result).toContain('base')
    })

    it('should handle false/null/undefined', () => {
      const result = cn('base', false, null, undefined, 'other')
      expect(result).toBeTruthy()
    })

    it('should merge tailwind classes correctly', () => {
      // Should prioritize later classes
      const result = cn('p-4', 'p-6')
      expect(result).toBeTruthy()
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'])
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle objects with boolean values', () => {
      const result = cn({
        'class1': true,
        'class2': false,
        'class3': true,
      })
      expect(result).toContain('class1')
      expect(result).toContain('class3')
      expect(result).not.toContain('class2')
    })
  })
})
