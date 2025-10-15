'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Appointment {
  id: string
  service_name: string
  doctor_name: string
  tenant_name: string
  start_time: string
  end_time: string
  status: string
  price: number
  payment_status?: string
  notes?: string
  created_at: string
}

interface MyAppointmentsClientProps {
  initialAppointments: Appointment[]
}

export default function MyAppointmentsClient({ initialAppointments }: MyAppointmentsClientProps) {
  const router = useRouter()
  const [appointments] = useState<Appointment[]>(initialAppointments)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all')

  async function handleCancelAppointment(appointmentId: string) {
    if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      return
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'PUT'
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Error canceling appointment:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    const labels = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    }

    const labels = {
      pending: 'Pendiente',
      completed: 'Pagado',
      failed: 'Falló'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[paymentStatus as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[paymentStatus as keyof typeof labels] || paymentStatus}
      </span>
    )
  }

  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.start_time)
    const now = new Date()

    switch (filter) {
      case 'upcoming':
        return appointmentDate >= now && appointment.status !== 'cancelled'
      case 'past':
        return appointmentDate < now || appointment.status === 'completed'
      case 'cancelled':
        return appointment.status === 'cancelled'
      default:
        return true
    }
  })

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Citas</h1>
            <p className="text-gray-600 mt-1">
              Gestiona y revisa el historial de tus citas médicas
            </p>
          </div>
          <Link
            href="/booking"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Nueva Cita
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Historial de Citas ({filteredAppointments.length})
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'upcoming'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Próximas
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'past'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pasadas
              </button>
              <button
                onClick={() => setFilter('cancelled')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'cancelled'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Canceladas
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes citas {filter !== 'all' ? filter === 'upcoming' ? 'próximas' : filter === 'past' ? 'pasadas' : 'canceladas' : ''}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all'
                  ? 'Aún no has reservado ninguna cita médica.'
                  : `No hay citas ${filter === 'upcoming' ? 'programadas para el futuro' : filter === 'past' ? 'en tu historial' : 'canceladas'}.`
                }
              </p>
              <Link
                href="/booking"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Reservar Primera Cita
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-6 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {appointment.service_name}
                        </h3>
                        {getStatusBadge(appointment.status)}
                        {appointment.payment_status && getPaymentStatusBadge(appointment.payment_status)}
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Doctor:</span>
                          Dr. {appointment.doctor_name}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Clínica:</span>
                          {appointment.tenant_name}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Fecha:</span>
                          {new Date(appointment.start_time).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Hora:</span>
                          {new Date(appointment.start_time).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} - {new Date(appointment.end_time).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Precio:</span>
                          ${appointment.price} MXN
                        </div>
                      </div>

                      {appointment.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <span className="text-sm font-medium text-gray-700">Notas:</span>
                          <p className="text-sm text-gray-600 mt-1">{appointment.notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col gap-2">
                      {appointment.status === 'pending' && appointment.payment_status === 'pending' && (
                        <Link
                          href={`/payment/${appointment.id}`}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 text-center"
                        >
                          Pagar Cita
                        </Link>
                      )}

                      {(appointment.status === 'pending' || appointment.status === 'confirmed') && new Date(appointment.start_time) > new Date() && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Cancelar
                        </button>
                      )}

                      {appointment.status === 'completed' && (
                        <div className="text-center">
                          <div className="text-xs text-gray-500">Cita completada</div>
                          <div className="text-xs text-gray-400">
                            {new Date(appointment.start_time).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
