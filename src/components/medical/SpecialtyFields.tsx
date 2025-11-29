'use client'

/**
 * Dynamic Specialty Fields Component
 * VT-245: Historias clínicas adaptativas por tipo de negocio
 */

import { useMemo } from 'react'
import { Icons } from '@/components/ui/Icons'
import type { MedicalFieldConfig } from '@/lib/medical-fields'
import { FIELD_CATEGORIES } from '@/lib/medical-fields'

interface SpecialtyFieldsProps {
  fields: MedicalFieldConfig[]
  formData: Record<string, unknown>
  onFieldChange: (fieldName: string, value: unknown) => void
  errors?: Record<string, string>
  disabled?: boolean
  showCategories?: boolean
}

export default function SpecialtyFields({
  fields,
  formData,
  onFieldChange,
  errors = {},
  disabled = false,
  showCategories = true
}: SpecialtyFieldsProps) {
  // Group fields by category
  const fieldsByCategory = useMemo(() => {
    if (!showCategories) {
      return [{ category: 'all', fields }]
    }

    const grouped: Record<string, MedicalFieldConfig[]> = {}
    fields.forEach(field => {
      if (!grouped[field.category]) {
        grouped[field.category] = []
      }
      grouped[field.category].push(field)
    })

    return Object.entries(grouped)
      .map(([category, categoryFields]) => ({
        category,
        categoryName: FIELD_CATEGORIES[category as keyof typeof FIELD_CATEGORIES]?.name || category,
        categoryIcon: FIELD_CATEGORIES[category as keyof typeof FIELD_CATEGORIES]?.icon || '📝',
        fields: categoryFields.sort((a, b) => a.order - b.order)
      }))
      .sort((a, b) => {
        const orderA = FIELD_CATEGORIES[a.category as keyof typeof FIELD_CATEGORIES]?.order || 99
        const orderB = FIELD_CATEGORIES[b.category as keyof typeof FIELD_CATEGORIES]?.order || 99
        return orderA - orderB
      })
  }, [fields, showCategories])

  const renderField = (field: MedicalFieldConfig) => {
    const value = formData[field.name]
    const error = errors[field.name]
    const fieldId = `field-${field.id}`

    const baseInputClasses = `w-full px-3 py-2 border rounded-md transition-colors
      ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}
      focus:outline-none focus:ring-2 focus:ring-opacity-50
      disabled:bg-gray-100 disabled:cursor-not-allowed`

    switch (field.type) {
      case 'text':
        return (
          <input
            id={fieldId}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseInputClasses}
          />
        )

      case 'textarea':
        return (
          <textarea
            id={fieldId}
            rows={3}
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseInputClasses}
          />
        )

      case 'number':
        return (
          <div className="flex items-center gap-2">
            <input
              id={fieldId}
              type="number"
              value={value !== undefined && value !== null && value !== '' ? String(value) : ''}
              onChange={(e) => onFieldChange(field.name, e.target.value ? Number(e.target.value) : '')}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step || 1}
              disabled={disabled}
              className={`${baseInputClasses} ${field.unit ? 'flex-1' : ''}`}
            />
            {field.unit && (
              <span className="text-sm text-gray-500 min-w-[40px]">{field.unit}</span>
            )}
          </div>
        )

      case 'date':
        return (
          <input
            id={fieldId}
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          />
        )

      case 'select':
        return (
          <select
            id={fieldId}
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        const selectedValues = (value as string[]) || []
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {field.options?.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      if (disabled) return
                      const newValues = isSelected
                        ? selectedValues.filter(v => v !== option.value)
                        : [...selectedValues, option.value]
                      onFieldChange(field.name, newValues)
                    }}
                    disabled={disabled}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors
                      ${isSelected
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                      }
                      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {isSelected && <Icons.check className="w-3 h-3 inline mr-1" />}
                    {option.label}
                  </button>
                )
              })}
            </div>
            {selectedValues.length > 0 && (
              <p className="text-xs text-gray-500">
                {selectedValues.length} seleccionado(s)
              </p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              id={fieldId}
              type="checkbox"
              checked={!!value}
              onChange={(e) => onFieldChange(field.name, e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Sí</span>
          </label>
        )

      case 'range':
        const rangeValue = value !== undefined && value !== '' ? Number(value) : field.min || 0
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <input
                id={fieldId}
                type="range"
                value={rangeValue}
                onChange={(e) => onFieldChange(field.name, Number(e.target.value))}
                min={field.min || 0}
                max={field.max || 10}
                step={field.step || 1}
                disabled={disabled}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className={`text-lg font-bold min-w-[40px] text-center
                ${rangeValue <= 3 ? 'text-green-600' : rangeValue <= 6 ? 'text-yellow-600' : 'text-red-600'}
              `}>
                {rangeValue}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{field.min || 0}</span>
              <span>{field.max || 10}</span>
            </div>
          </div>
        )

      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            <input
              id={fieldId}
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onFieldChange(field.name, file)
                }
              }}
              disabled={disabled}
              className="hidden"
            />
            <label
              htmlFor={fieldId}
              className={`cursor-pointer ${disabled ? 'opacity-50' : ''}`}
            >
              <Icons.upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {value ? (value as File).name : 'Clic para subir archivo'}
              </p>
            </label>
          </div>
        )

      default:
        return (
          <input
            id={fieldId}
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={baseInputClasses}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {fieldsByCategory.map((category) => (
        <div key={category.category}>
          {showCategories && 'categoryName' in category && (
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              <span>{category.categoryIcon}</span>
              {category.categoryName}
            </h4>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.fields.map((field) => (
              <div
                key={field.id}
                className={`${field.type === 'textarea' ? 'md:col-span-2' : ''}`}
              >
                <label
                  htmlFor={`field-${field.id}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {renderField(field)}

                {field.helpText && !errors[field.name] && (
                  <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
                )}

                {errors[field.name] && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <Icons.alertCircle className="w-3 h-3" />
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Icons.info className="w-8 h-8 mx-auto mb-2" />
          <p>No hay campos adicionales para esta especialidad</p>
        </div>
      )}
    </div>
  )
}
