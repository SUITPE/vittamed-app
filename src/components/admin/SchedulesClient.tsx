'use client'

import { useState, useMemo } from 'react'
import { Icons } from '@/components/ui/Icons'

interface Schedule {
  id: string
  doctor_name: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface Doctor {
  id: string
  name: string
}

interface SchedulesClientProps {
  initialSchedules: Schedule[]
  doctors?: Doctor[]
}

export default function SchedulesClient({ initialSchedules, doctors = [] }: SchedulesClientProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all')

  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[dayOfWeek]
  }

  const formatTime = (time: string) => {
    // Convert 24h format to display format
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  // Group schedules by doctor
  const schedulesByDoctor = useMemo(() => {
    const grouped = new Map<string, Schedule[]>()
    initialSchedules.forEach(schedule => {
      const existing = grouped.get(schedule.doctor_name) || []
      grouped.set(schedule.doctor_name, [...existing, schedule])
    })
    return grouped
  }, [initialSchedules])

  // Filter schedules based on selected doctor
  const filteredSchedules = useMemo(() => {
    if (selectedDoctor === 'all') return initialSchedules
    return initialSchedules.filter(s => s.doctor_name === selectedDoctor)
  }, [initialSchedules, selectedDoctor])

  // Get unique doctor names from schedules
  const doctorNames = useMemo(() => {
    return Array.from(new Set(initialSchedules.map(s => s.doctor_name)))
  }, [initialSchedules])

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Horarios
        </h1>
        <p className="text-gray-600 mt-1">
          Administra los horarios de disponibilidad de todos los profesionales
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#40C9C6]/10 rounded-lg">
              <Icons.users className="w-6 h-6 text-[#40C9C6]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{schedulesByDoctor.size}</div>
              <div className="text-sm text-gray-500">Profesionales con horario</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Icons.calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{initialSchedules.length}</div>
              <div className="text-sm text-gray-500">Bloques de horario</div>
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
                {initialSchedules.filter(s => s.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Horarios activos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      {doctorNames.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#40C9C6] focus:border-[#40C9C6]"
          >
            <option value="all">Todos los profesionales</option>
            {doctorNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Horarios Configurados</h2>
            <p className="text-sm text-gray-500 mt-1">
              {filteredSchedules.length} {filteredSchedules.length === 1 ? 'horario' : 'horarios'} encontrados
            </p>
          </div>
        </div>

        <div className="p-6">
          {filteredSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Icons.calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No hay horarios configurados</p>
              <p className="text-sm text-gray-400">
                Los profesionales pueden configurar su disponibilidad desde su agenda personal
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSchedules.map((schedule) => (
                <div key={schedule.id} className="border rounded-lg p-4 hover:border-[#40C9C6] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#40C9C6] to-[#33a19e] flex items-center justify-center text-white font-semibold text-sm">
                        {schedule.doctor_name.split(' ').slice(1).map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {schedule.doctor_name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                            {getDayName(schedule.day_of_week)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Icons.clock className="w-3.5 h-3.5" />
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        schedule.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {schedule.is_active ? 'Activo' : 'Inactivo'}
                      </span>
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
