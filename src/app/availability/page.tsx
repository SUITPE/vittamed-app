'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DoctorSidebar from '@/components/DoctorSidebar'
import AdminSidebar from '@/components/AdminSidebar'
import AdminHeader from '@/components/AdminHeader'
import VisualAvailabilityEditor from '@/components/agenda/VisualAvailabilityEditor'
import { Icons } from '@/components/ui/Icons'

interface DoctorAvailability {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
}

export default function AvailabilityPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [availability, setAvailability] = useState<DoctorAvailability[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is schedulable
    if (!loading && user) {
      if (!user.profile?.schedulable) {
        // Redirect non-schedulable users
        router.push('/dashboard')
        return
      }
      fetchAvailability()
    } else if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  async function fetchAvailability() {
    try {
      if (!user?.id) {
        setLoadingData(false)
        return
      }

      const response = await fetch(`/api/doctors/${user.id}/availability`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAvailability(data || [])
        setError(null)
      } else if (response.status === 401) {
        router.push('/auth/login')
        return
      } else {
        setError('Error al cargar la disponibilidad')
        setAvailability([])
      }
    } catch (err) {
      console.error('Error fetching availability:', err)
      setError('Error de conexión')
      setAvailability([])
    } finally {
      setLoadingData(false)
    }
  }

  async function handleAvailabilityUpdate(blocks: Array<{ day: number; startTime: string; endTime: string }>) {
    try {
      const response = await fetch(`/api/doctors/${user?.id}/availability`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blocks })
      })

      if (response.ok) {
        await fetchAvailability()
        setError(null)
      } else if (response.status === 401) {
        router.push('/auth/login')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Error al guardar')
      }
    } catch (err) {
      console.error('Error saving availability:', err)
      setError('Error de conexión al guardar')
      throw err
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando disponibilidad...</p>
        </div>
      </div>
    )
  }

  const isAdminOrStaff = ['admin_tenant', 'receptionist', 'staff', 'super_admin'].includes(user?.profile?.role || '')

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isAdminOrStaff ? (
        <AdminSidebar tenantId={user?.profile?.tenant_id} />
      ) : (
        <DoctorSidebar />
      )}
      <div className="flex-1">
        <AdminHeader />
        <div className="pt-16 p-6">
          <div className="max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icons.clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Mi Disponibilidad
                  </h1>
                  <p className="text-gray-600">
                    Configura los horarios en que puedes recibir citas
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <Icons.alertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
                <button
                  onClick={fetchAvailability}
                  className="ml-auto text-red-600 hover:text-red-800 font-medium"
                >
                  Reintentar
                </button>
              </div>
            )}

            {/* Availability Editor */}
            <VisualAvailabilityEditor
              availability={availability}
              onUpdate={handleAvailabilityUpdate}
            />

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Icons.calendarDays className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {availability.length}
                    </div>
                    <div className="text-sm text-gray-500">Bloques configurados</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Icons.checkCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {new Set(availability.map(a => a.day_of_week)).size}
                    </div>
                    <div className="text-sm text-gray-500">Días activos</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Icons.clock3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {calculateTotalHours(availability)}h
                    </div>
                    <div className="text-sm text-gray-500">Horas semanales</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to calculate total weekly hours
function calculateTotalHours(availability: DoctorAvailability[]): number {
  let totalMinutes = 0

  availability.forEach(block => {
    const [startHour, startMin] = block.start_time.split(':').map(Number)
    const [endHour, endMin] = block.end_time.split(':').map(Number)

    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    totalMinutes += endMinutes - startMinutes
  })

  return Math.round(totalMinutes / 60)
}
