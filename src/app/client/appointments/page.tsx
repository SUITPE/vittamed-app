'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ClientNavigation from '@/components/ClientNavigation'
import Link from 'next/link'

interface Appointment {
  id: string
  tenant_id: string
  tenant_name: string
  doctor_name: string
  service_name: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  amount?: number
  payment_status?: string
  location?: string
}

export default function ClientAppointmentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [error, setError] = useState('')

  // Check if user is client
  const isClient = user?.profile?.role === 'client'

  useEffect(() => {
    if (!loading && (!user || user.profile?.role !== 'client')) {
      router.push('/auth/login')
      return
    }

    if (user && isClient) {
      fetchMyAppointments()
    }
  }, [user, loading, router, isClient])

  async function fetchMyAppointments() {
    try {
      setLoadingData(true)
      setError('')

      // Fetch appointments for this client across all tenants
      const response = await fetch(`/api/clients/${user?.id}/appointments`)

      if (response.ok) {
        const appointmentsData = await response.json()
        let filteredAppointments = appointmentsData || []

        // Filter by status if selected
        if (selectedStatus) {
          filteredAppointments = filteredAppointments.filter(
            (apt: Appointment) => apt.status === selectedStatus
          )
        }

        // Sort by start_time (most recent first)
        filteredAppointments.sort((a: Appointment, b: Appointment) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        )

        setAppointments(filteredAppointments)
      } else {
        console.warn('Could not fetch appointments')
        setAppointments([])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setError('Error al cargar mis citas')
    } finally {
      setLoadingData(false)
    }
  }

  // Refresh when filters change
  useEffect(() => {
    if (user && isClient) {
      fetchMyAppointments()
    }
  }, [selectedStatus])

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    const statusLabels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const getPaymentStatusBadge = (paymentStatus?: string) => {
    if (!paymentStatus) return null

    const colors = {
      pending: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }

    const statusLabels = {
      pending: 'Pendiente',
      paid: 'Pagado',
      failed: 'Falló',
      refunded: 'Reembolsado'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[paymentStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[paymentStatus as keyof typeof statusLabels] || paymentStatus}
      </span>
    )
  }

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return ''
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientNavigation currentPath="/client/appointments" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mis citas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Acceso Restringido
              </h2>
              <p className="text-gray-600">
                Solo los clientes pueden acceder a esta página.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const upcomingAppointments = appointments.filter(apt =>
    new Date(apt.start_time) > new Date() && apt.status !== 'cancelled'
  )
  const pastAppointments = appointments.filter(apt =>
    new Date(apt.start_time) <= new Date() || apt.status === 'cancelled'
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavigation currentPath="/client/appointments" />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              📅 Mis Citas
            </h1>
            <p className="text-gray-600 mt-1">
              Historial y gestión de todas tus citas médicas
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm mb-8 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/booking"
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
              >
                <span className="mr-2">➕</span>
                Nueva Cita
              </Link>
              <Link
                href="/client/payments"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <span className="mr-2">💳</span>
                Ver Pagos
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Estado
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="completed">Completadas</option>
                    <option value="cancelled">Canceladas</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <div className="text-sm text-gray-500">
                    {appointments.length} cita{appointments.length !== 1 ? 's' : ''} total
                    {selectedStatus && ` (filtradas)`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm mb-8">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Próximas Citas ({upcomingAppointments.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {appointment.service_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Dr. {appointment.doctor_name} - {appointment.tenant_name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(appointment.status)}
                        {getPaymentStatusBadge(appointment.payment_status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Fecha y Hora:</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(appointment.start_time)}
                        </p>
                        <p className="text-sm text-gray-900">
                          {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                        </p>
                      </div>

                      {appointment.location && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Ubicación:</p>
                          <p className="text-sm text-gray-900">{appointment.location}</p>
                        </div>
                      )}

                      {appointment.amount && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Costo:</p>
                          <p className="text-sm text-gray-900">{formatCurrency(appointment.amount)}</p>
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700">Notas:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Appointments */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Historial de Citas ({pastAppointments.length})
              </h2>
            </div>

            {pastAppointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  No tienes citas anteriores
                </div>
                <p className="text-sm text-gray-400">
                  Tu historial de citas aparecerá aquí después de completar tu primera cita
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {pastAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {appointment.service_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Dr. {appointment.doctor_name} - {appointment.tenant_name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(appointment.status)}
                        {getPaymentStatusBadge(appointment.payment_status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Fecha y Hora:</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(appointment.start_time)}
                        </p>
                        <p className="text-sm text-gray-900">
                          {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                        </p>
                      </div>

                      {appointment.location && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Ubicación:</p>
                          <p className="text-sm text-gray-900">{appointment.location}</p>
                        </div>
                      )}

                      {appointment.amount && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Costo:</p>
                          <p className="text-sm text-gray-900">{formatCurrency(appointment.amount)}</p>
                        </div>
                      )}
                    </div>

                    {appointment.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Notas:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {appointments.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Resumen de Citas
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {appointments.length}
                    </div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">
                      {upcomingAppointments.length}
                    </div>
                    <div className="text-sm text-gray-500">Próximas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {appointments.filter(a => a.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-500">Completadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {appointments.filter(a => a.status === 'cancelled').length}
                    </div>
                    <div className="text-sm text-gray-500">Canceladas</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}