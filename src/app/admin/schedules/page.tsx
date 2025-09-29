'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface Schedule {
  id: string
  doctor_name: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export default function SchedulesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.profile?.role !== 'admin_tenant')) {
      router.push('/auth/login')
      return
    }

    if (user && user.profile?.role === 'admin_tenant') {
      fetchSchedules()
    }
  }, [user, loading, router])

  async function fetchSchedules() {
    try {
      setLoadingData(true)
      // Placeholder for schedules API
      // In a real implementation, this would fetch from /api/admin/schedules
      const mockSchedules: Schedule[] = [
        {
          id: '1',
          doctor_name: 'Dr. Ana Rodríguez',
          day_of_week: 1,
          start_time: '09:00',
          end_time: '17:00',
          is_active: true
        },
        {
          id: '2',
          doctor_name: 'Dr. Ana Rodríguez',
          day_of_week: 2,
          start_time: '09:00',
          end_time: '17:00',
          is_active: true
        }
      ]
      setSchedules(mockSchedules)
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[dayOfWeek]
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando horarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Horarios
          </h1>
          <p className="text-gray-600 mt-1">
            Administra los horarios de disponibilidad de todos los doctores
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Horarios Actuales</h2>
            <p className="text-sm text-gray-500 mt-1">
              Lista de todos los horarios configurados
            </p>
          </div>

          <div className="p-6">
            {schedules.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay horarios configurados
              </p>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {schedule.doctor_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getDayName(schedule.day_of_week)} • {schedule.start_time} - {schedule.end_time}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          schedule.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {schedule.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        <button className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200">
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}