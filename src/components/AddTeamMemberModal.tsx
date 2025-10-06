'use client'

import { useState } from 'react'
import { UserRole, isValidUserRole, getRoleDisplayName, getRoleColor, UserRoleView } from '@/types/user'

interface AddTeamMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (member: UserRoleView) => void
  tenantId: string
  tenantName: string
}

interface TeamMemberForm {
  email: string
  first_name: string
  last_name: string
  role: UserRole
  send_invitation: boolean
}

export default function AddTeamMemberModal({
  isOpen,
  onClose,
  onSuccess,
  tenantId,
  tenantName
}: AddTeamMemberModalProps) {
  const [formData, setFormData] = useState<TeamMemberForm>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'staff',
    send_invitation: true
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [createdMember, setCreatedMember] = useState<any>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      // Validate form
      if (!formData.email.trim()) {
        setError('El email es requerido')
        setSubmitting(false)
        return
      }

      if (!isValidUserRole(formData.role)) {
        setError('Rol inválido')
        setSubmitting(false)
        return
      }

      // Create team member via API
      const response = await fetch(`/api/tenants/${tenantId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          email: formData.email.trim().toLowerCase(),
          first_name: formData.first_name.trim() || undefined,
          last_name: formData.last_name.trim() || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCreatedMember(data.user)
        setStep('success')
        onSuccess(data.user)
      } else {
        if (response.status === 409) {
          setError('Un usuario con este email ya existe. ¿Deseas asignarlo a este negocio?')
        } else {
          setError(data.error || 'Error al crear el miembro del equipo')
        }
      }
    } catch (error) {
      setError('Error inesperado al crear el miembro del equipo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      role: 'staff',
      send_invitation: true
    })
    setError('')
    setStep('form')
    setCreatedMember(null)
    onClose()
  }

  const getRoleDescription = (role: UserRole) => {
    const descriptions: Record<UserRole, string> = {
      super_admin: 'Super administrador con acceso total al sistema.',
      admin_tenant: 'Acceso completo al negocio, puede gestionar usuarios y configuraciones.',
      doctor: 'Puede gestionar agenda, pacientes y consultas médicas.',
      staff: 'Puede asistir con recepción, citas y tareas administrativas.',
      receptionist: 'Puede gestionar citas, pacientes y tareas de recepción.',
      patient: 'Acceso básico como paciente para reservar citas.',
      member: 'Miembro del equipo con acceso a funciones específicas.',
      client: 'Cliente con acceso para reservar y gestionar sus citas.'
    }
    return descriptions[role]
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">

        {step === 'form' && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Agregar Miembro del Equipo
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Invitar nuevo miembro a {tenantName}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nombre"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Apellido"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="staff">Personal</option>
                  <option value="doctor">Doctor/a</option>
                  <option value="admin_tenant">Administrador</option>
                  <option value="patient">Paciente</option>
                </select>

                {/* Role Description */}
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(formData.role)}`}>
                      {getRoleDisplayName(formData.role)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {getRoleDescription(formData.role)}
                  </p>
                </div>
              </div>

              {/* Send Invitation */}
              <div className="flex items-center">
                <input
                  id="send_invitation"
                  type="checkbox"
                  checked={formData.send_invitation}
                  onChange={(e) => setFormData(prev => ({ ...prev, send_invitation: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="send_invitation" className="ml-2 block text-sm text-gray-700">
                  Enviar invitación por email
                </label>
              </div>

              {!formData.send_invitation && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Sin invitación por email, deberás proporcionar las credenciales manualmente.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Creando...</span>
                    </div>
                  ) : (
                    'Crear Miembro'
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {step === 'success' && createdMember && (
          <>
            {/* Success Message */}
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ¡Miembro Agregado!
              </h3>

              <p className="text-sm text-gray-600 mb-4">
                {createdMember.first_name || createdMember.email} ha sido agregado exitosamente al equipo.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 font-medium">Email:</span>
                  <span className="text-blue-900">{createdMember.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-blue-800 font-medium">Rol:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(createdMember.role)}`}>
                    {getRoleDisplayName(createdMember.role)}
                  </span>
                </div>
              </div>

              {formData.send_invitation ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-green-800">
                    📧 Se ha enviado una invitación por email con las credenciales de acceso.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Recuerda proporcionar las credenciales de acceso al nuevo miembro.
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md transition-colors"
              >
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}