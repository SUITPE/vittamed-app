'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import PaymentForm from '@/components/PaymentForm'
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton'

interface Appointment {
  id: string
  patient_name: string
  service_name: string
  doctor_name: string
  start_time: string
  end_time: string
  price: number
  payment_status: string
}

export default function PaymentPage() {
  const { appointmentId } = useParams() as { appointmentId: string }
  const { user } = useAuth()
  const router = useRouter()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  useEffect(() => {
    if (user && appointmentId) {
      fetchAppointment()
    }
  }, [user, appointmentId])

  async function fetchAppointment() {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`)

      if (!response.ok) {
        throw new Error('Appointment not found')
      }

      const data = await response.json()

      if (data.payment_status === 'completed') {
        setPaymentSuccess(true)
      } else {
        setAppointment(data)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error loading appointment')
    } finally {
      setLoading(false)
    }
  }

  function handlePaymentSuccess() {
    setPaymentSuccess(true)
    setTimeout(() => {
      router.push('/my-appointments')
    }, 3000)
  }

  function handlePaymentError(errorMessage: string) {
    setError(errorMessage)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <SkeletonCard className="overflow-hidden">
            <div className="px-6 py-4 border-b">
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="px-6 py-4 space-y-6">
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </div>
          </SkeletonCard>
        </div>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Pago Exitoso!</h1>
            <p className="text-gray-600 mb-6">
              Tu pago ha sido procesado correctamente. Tu cita está confirmada.
            </p>
            <p className="text-sm text-gray-500">
              Redirigiendo a tus citas en 3 segundos...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cita no encontrada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h1 className="text-2xl font-bold text-gray-900">Confirmar Pago</h1>
          </div>

          <div className="px-6 py-4">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles de la Cita</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Paciente:</span>
                  <span className="font-medium">{appointment.patient_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Servicio:</span>
                  <span className="font-medium">{appointment.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Doctor:</span>
                  <span className="font-medium">Dr. {appointment.doctor_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fecha y Hora:</span>
                  <span className="font-medium">
                    {new Date(appointment.start_time).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} a las {new Date(appointment.start_time).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Pago</h2>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
                  {error}
                </div>
              )}
              <PaymentForm
                appointmentId={appointment.id}
                amount={appointment.price}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}