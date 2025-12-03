'use client'

import { useState } from 'react'
import { Icons } from '@/components/ui/Icons'
import type { PatientAllergy, AllergyType, Severity } from '@/types/medical-history'
import { ALLERGY_TYPE_CONFIG, SEVERITY_CONFIG } from '@/types/medical-history'

interface AllergyFormProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  allergyToEdit?: PatientAllergy | null
  onSuccess: () => void
}

export default function AllergyForm({
  isOpen,
  onClose,
  patientId,
  allergyToEdit,
  onSuccess
}: AllergyFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    allergen: allergyToEdit?.allergen || '',
    allergy_type: allergyToEdit?.allergy_type || 'medication' as AllergyType,
    reaction: allergyToEdit?.reaction || '',
    severity: allergyToEdit?.severity || 'moderate' as Severity,
    notes: allergyToEdit?.notes || '',
    first_observed: allergyToEdit?.first_observed || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = allergyToEdit
        ? `/api/patients/${patientId}/allergies/${allergyToEdit.id}`
        : `/api/patients/${patientId}/allergies`

      const method = allergyToEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${allergyToEdit ? 'update' : 'create'} allergy`)
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving allergy:', error)
      alert(error instanceof Error ? error.message : 'Error al guardar la alergia')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            {/* Header */}
            <div className="bg-yellow-500 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {allergyToEdit ? 'Editar Alergia' : 'Nueva Alergia'}
                  </h2>
                  <p className="text-yellow-100 text-sm mt-1">
                    Registre información importante sobre alergias
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-yellow-600 rounded-full transition-colors"
                >
                  <Icons.x className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {/* Allergen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alérgeno *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.allergen}
                    onChange={(e) => setFormData({ ...formData, allergen: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Ej: Penicilina, Mariscos, Polen"
                  />
                </div>

                {/* Allergy Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Alergia *
                  </label>
                  <select
                    required
                    value={formData.allergy_type}
                    onChange={(e) => setFormData({ ...formData, allergy_type: e.target.value as AllergyType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    {Object.entries(ALLERGY_TYPE_CONFIG).map(([value, config]) => (
                      <option key={value} value={value}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reaction */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reacción
                  </label>
                  <textarea
                    rows={2}
                    value={formData.reaction}
                    onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Describa la reacción alérgica..."
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Severidad
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as Severity })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    {Object.entries(SEVERITY_CONFIG).map(([value, config]) => (
                      <option key={value} value={value}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* First Observed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primera Observación
                  </label>
                  <input
                    type="date"
                    value={formData.first_observed}
                    onChange={(e) => setFormData({ ...formData, first_observed: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas Adicionales
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Información adicional relevante..."
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {allergyToEdit ? 'Actualizando...' : 'Guardando...'}
                      </>
                    ) : (
                      <>
                        <Icons.checkCircle className="w-4 h-4" />
                        {allergyToEdit ? 'Actualizar' : 'Guardar'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
