/**
 * Hook for managing medical forms by specialty
 * VT-245: Historias clínicas adaptativas por tipo de negocio
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  getFieldsForSpecialty,
  getSpecialtyFromTenantType,
  SPECIALTY_CONFIG,
  FIELD_CATEGORIES,
  type SpecialtyType,
  type MedicalFieldConfig
} from '@/lib/medical-fields'

interface UseMedicalFormBySpecialtyOptions {
  tenantType?: string
  specialty?: SpecialtyType
  initialData?: Record<string, unknown>
}

interface FieldsByCategory {
  category: keyof typeof FIELD_CATEGORIES
  categoryName: string
  categoryIcon: string
  fields: MedicalFieldConfig[]
}

export function useMedicalFormBySpecialty(options: UseMedicalFormBySpecialtyOptions = {}) {
  const { tenantType, specialty: explicitSpecialty, initialData = {} } = options

  // Determine specialty from tenant type or explicit value
  const specialty = useMemo(() => {
    if (explicitSpecialty) return explicitSpecialty
    if (tenantType) return getSpecialtyFromTenantType(tenantType)
    return 'general' as SpecialtyType
  }, [tenantType, explicitSpecialty])

  // Get fields for this specialty
  const fields = useMemo(() => getFieldsForSpecialty(specialty), [specialty])

  // Get specialty display info
  const specialtyInfo = useMemo(() => SPECIALTY_CONFIG[specialty], [specialty])

  // Group fields by category
  const fieldsByCategory = useMemo((): FieldsByCategory[] => {
    const grouped: Record<string, MedicalFieldConfig[]> = {}

    fields.forEach(field => {
      if (!grouped[field.category]) {
        grouped[field.category] = []
      }
      grouped[field.category].push(field)
    })

    return Object.entries(grouped)
      .map(([category, categoryFields]) => ({
        category: category as keyof typeof FIELD_CATEGORIES,
        categoryName: FIELD_CATEGORIES[category as keyof typeof FIELD_CATEGORIES]?.name || category,
        categoryIcon: FIELD_CATEGORIES[category as keyof typeof FIELD_CATEGORIES]?.icon || '📝',
        fields: categoryFields.sort((a, b) => a.order - b.order)
      }))
      .sort((a, b) => {
        const orderA = FIELD_CATEGORIES[a.category]?.order || 99
        const orderB = FIELD_CATEGORIES[b.category]?.order || 99
        return orderA - orderB
      })
  }, [fields])

  // Form state management
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    fields.forEach(field => {
      if (initialData[field.name] !== undefined) {
        initial[field.name] = initialData[field.name]
      } else if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue
      } else if (field.type === 'checkbox') {
        initial[field.name] = false
      } else if (field.type === 'multiselect') {
        initial[field.name] = []
      } else {
        initial[field.name] = ''
      }
    })
    return initial
  })

  // Update form data when specialty changes
  useEffect(() => {
    setFormData(prev => {
      const updated: Record<string, unknown> = {}
      fields.forEach(field => {
        if (prev[field.name] !== undefined) {
          updated[field.name] = prev[field.name]
        } else if (initialData[field.name] !== undefined) {
          updated[field.name] = initialData[field.name]
        } else if (field.defaultValue !== undefined) {
          updated[field.name] = field.defaultValue
        } else if (field.type === 'checkbox') {
          updated[field.name] = false
        } else if (field.type === 'multiselect') {
          updated[field.name] = []
        } else {
          updated[field.name] = ''
        }
      })
      return updated
    })
  }, [fields, initialData])

  // Update single field
  const updateField = useCallback((fieldName: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }, [])

  // Update multiple fields at once
  const updateFields = useCallback((updates: Record<string, unknown>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  // Reset form to initial state
  const resetForm = useCallback(() => {
    const initial: Record<string, unknown> = {}
    fields.forEach(field => {
      if (initialData[field.name] !== undefined) {
        initial[field.name] = initialData[field.name]
      } else if (field.defaultValue !== undefined) {
        initial[field.name] = field.defaultValue
      } else if (field.type === 'checkbox') {
        initial[field.name] = false
      } else if (field.type === 'multiselect') {
        initial[field.name] = []
      } else {
        initial[field.name] = ''
      }
    })
    setFormData(initial)
  }, [fields, initialData])

  // Validate form
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}

    fields.forEach(field => {
      const value = formData[field.name]

      // Check required fields
      if (field.required) {
        if (value === undefined || value === null || value === '') {
          errors[field.name] = `${field.label} es requerido`
        } else if (Array.isArray(value) && value.length === 0) {
          errors[field.name] = `${field.label} es requerido`
        }
      }

      // Check number ranges
      if (field.type === 'number' && value !== '' && value !== undefined) {
        const numValue = Number(value)
        if (field.min !== undefined && numValue < field.min) {
          errors[field.name] = `${field.label} debe ser al menos ${field.min}`
        }
        if (field.max !== undefined && numValue > field.max) {
          errors[field.name] = `${field.label} debe ser máximo ${field.max}`
        }
      }

      // Custom validation from field config
      if (field.validation && value) {
        const result = field.validation.safeParse(value)
        if (!result.success) {
          errors[field.name] = result.error.issues[0]?.message || 'Valor inválido'
        }
      }
    })

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }, [fields, formData])

  // Get data formatted for API submission
  const getSubmitData = useCallback(() => {
    const data: Record<string, unknown> = {}

    fields.forEach(field => {
      const value = formData[field.name]
      // Only include non-empty values
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length === 0) {
          return // Skip empty arrays
        }
        data[field.name] = value
      }
    })

    return data
  }, [fields, formData])

  // Check if form has changes
  const hasChanges = useMemo(() => {
    return fields.some(field => {
      const currentValue = formData[field.name]
      const initialValue = initialData[field.name]

      if (initialValue === undefined) {
        // Check if current value is different from default
        if (field.type === 'checkbox') return currentValue !== false
        if (field.type === 'multiselect') return Array.isArray(currentValue) && currentValue.length > 0
        return currentValue !== '' && currentValue !== field.defaultValue
      }

      return currentValue !== initialValue
    })
  }, [fields, formData, initialData])

  return {
    // Specialty info
    specialty,
    specialtyInfo,

    // Fields
    fields,
    fieldsByCategory,

    // Form state
    formData,
    updateField,
    updateFields,
    resetForm,

    // Validation
    validateForm,

    // Submission
    getSubmitData,
    hasChanges
  }
}

export default useMedicalFormBySpecialty
