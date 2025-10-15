'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icons } from '@/components/ui/Icons'

interface Patient {
  id: string
  first_name: string
  last_name: string
  email: string
  document: string
  phone?: string
  date_of_birth?: string
  address?: string
  medical_history?: string
  is_active: boolean
  created_at: string
}

interface PatientsClientProps {
  initialPatients: Patient[]
  tenantName: string
}

export default function PatientsClient({ initialPatients, tenantName }: PatientsClientProps) {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    document: '',
    phone: '',
    date_of_birth: '',
    address: '',
    medical_history: ''
  })

  const refreshPatients = () => {
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const url = selectedPatient ? `/api/patients/${selectedPatient.id}` : '/api/patients'
      const method = selectedPatient ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        refreshPatients()
        handleCloseModal()
      } else {
        setError('Error al guardar paciente')
      }
    } catch (error) {
      console.error('Error saving patient:', error)
      setError('Error al guardar paciente')
    }
  }

  function handleEdit(patient: Patient) {
    setSelectedPatient(patient)
    setFormData({
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      document: patient.document || '',
      phone: patient.phone || '',
      date_of_birth: patient.date_of_birth || '',
      address: patient.address || '',
      medical_history: patient.medical_history || ''
    })
    setShowAddModal(true)
  }

  function handleCloseModal() {
    setShowAddModal(false)
    setSelectedPatient(null)
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      document: '',
      phone: '',
      date_of_birth: '',
      address: '',
      medical_history: ''
    })
  }

  async function handleToggleStatus(patientId: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !isActive })
      })

      if (response.ok) {
        refreshPatients()
      }
    } catch (error) {
      console.error('Error updating patient status:', error)
    }
  }

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.document?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pacientes - {tenantName}
            </h1>
            <p className="text-gray-600 mt-1">
              Administra la información de tus pacientes
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
          >
            <Icons.plus className="w-5 h-5" />
            Agregar Paciente
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Lista de Pacientes ({filteredPatients.length})
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icons.search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Nacimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icons.user className="w-5 h-5 text-white" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.document || 'No registrado'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Icons.phone className="w-4 h-4 text-gray-400" />
                      {patient.phone || 'No registrado'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {patient.date_of_birth
                        ? (() => {
                            const [year, month, day] = patient.date_of_birth.split('-')
                            return `${day}/${month}/${year}`
                          })()
                        : 'No registrada'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      patient.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {patient.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => router.push(`/patients/${patient.id}`)}
                        className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Ver perfil e historia clínica"
                      >
                        <Icons.activity className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(patient)}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar información del paciente"
                      >
                        <Icons.edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(patient.id, patient.is_active)}
                        className={`p-2 rounded-lg transition-colors ${
                          patient.is_active
                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                        title={patient.is_active ? 'Desactivar paciente' : 'Activar paciente'}
                      >
                        {patient.is_active ? (
                          <Icons.x className="w-5 h-5" />
                        ) : (
                          <Icons.checkCircle className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron pacientes</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedPatient ? 'Editar Paciente' : 'Agregar Paciente'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icons.x className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID / Documento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.document}
                    onChange={(e) => setFormData(prev => ({ ...prev, document: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="DNI, Pasaporte, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Historial Médico
                  </label>
                  <textarea
                    value={formData.medical_history}
                    onChange={(e) => setFormData(prev => ({ ...prev, medical_history: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {selectedPatient ? 'Actualizar' : 'Agregar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
