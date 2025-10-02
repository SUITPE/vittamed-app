'use client'

import { useState } from 'react'
import { Icons } from '@/components/ui/Icons'

interface DayAvailability {
  day_of_week: number
  start_time: string
  end_time: string
  lunch_start?: string
  lunch_end?: string
}

interface AvailabilitySettingsProps {
  availability: DayAvailability[]
  onUpdate: (dayOfWeek: number, data: Partial<DayAvailability>) => Promise<void>
  onDelete: (dayOfWeek: number) => Promise<void>
}

export default function AvailabilitySettings({
  availability,
  onUpdate,
  onDelete
}: AvailabilitySettingsProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const [saving, setSaving] = useState<number | null>(null)

  const days = [
    { value: 1, name: 'Lunes', icon: '📅' },
    { value: 2, name: 'Martes', icon: '📅' },
    { value: 3, name: 'Miércoles', icon: '📅' },
    { value: 4, name: 'Jueves', icon: '📅' },
    { value: 5, name: 'Viernes', icon: '📅' },
    { value: 6, name: 'Sábado', icon: '📅' },
    { value: 0, name: 'Domingo', icon: '📅' }
  ]

  const handleToggleDay = async (dayOfWeek: number) => {
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek)

    setSaving(dayOfWeek)
    try {
      if (dayAvailability) {
        await onDelete(dayOfWeek)
      } else {
        await onUpdate(dayOfWeek, {
          start_time: '09:00',
          end_time: '18:00',
          lunch_start: '13:00',
          lunch_end: '14:00'
        })
        setExpandedDay(dayOfWeek)
      }
    } finally {
      setSaving(null)
    }
  }

  const handleUpdateTime = async (dayOfWeek: number, field: string, value: string) => {
    const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek)
    if (!dayAvailability) return

    setSaving(dayOfWeek)
    try {
      await onUpdate(dayOfWeek, {
        ...dayAvailability,
        [field]: value
      })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configurar Disponibilidad
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Define tus horarios de trabajo para cada día de la semana
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {availability.length} de 7 días configurados
          </div>
        </div>
      </div>

      <div className="divide-y">
        {days.map((day) => {
          const dayAvailability = availability.find(a => a.day_of_week === day.value)
          const isExpanded = expandedDay === day.value
          const isSaving = saving === day.value
          const isAvailable = !!dayAvailability

          return (
            <div key={day.value} className="p-4 hover:bg-gray-50 transition-colors">
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => setExpandedDay(isExpanded ? null : day.value)}
                    disabled={!isAvailable}
                    className={`flex items-center gap-3 flex-1 text-left ${
                      !isAvailable ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="text-2xl">{day.icon}</div>
                    <div>
                      <div className="font-medium text-gray-900">{day.name}</div>
                      {isAvailable && dayAvailability && (
                        <div className="text-sm text-gray-500 mt-0.5">
                          {dayAvailability.start_time} - {dayAvailability.end_time}
                          {dayAvailability.lunch_start && (
                            <span className="ml-2 text-gray-400">
                              • Almuerzo: {dayAvailability.lunch_start} - {dayAvailability.lunch_end}
                            </span>
                          )}
                        </div>
                      )}
                      {!isAvailable && (
                        <div className="text-sm text-gray-400">No disponible</div>
                      )}
                    </div>
                  </button>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleDay(day.value)}
                    disabled={isSaving}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    style={{
                      backgroundColor: isAvailable ? '#22c55e' : '#d1d5db'
                    }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isAvailable ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  {/* Expand Button */}
                  {isAvailable && (
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : day.value)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <Icons.chevronDown
                        className={`w-5 h-5 text-gray-500 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Settings */}
              {isExpanded && dayAvailability && (
                <div className="mt-4 pl-14 pr-4 space-y-4 animate-in slide-in-from-top-2">
                  {/* Working Hours */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Horario de Trabajo
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Inicio</label>
                        <div className="relative">
                          <Icons.clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            value={dayAvailability.start_time || '09:00'}
                            onChange={(e) => handleUpdateTime(day.value, 'start_time', e.target.value)}
                            disabled={isSaving}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Fin</label>
                        <div className="relative">
                          <Icons.clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            value={dayAvailability.end_time || '18:00'}
                            onChange={(e) => handleUpdateTime(day.value, 'end_time', e.target.value)}
                            disabled={isSaving}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lunch Break */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Horario de Almuerzo (Opcional)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Inicio</label>
                        <div className="relative">
                          <Icons.utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            value={dayAvailability.lunch_start || '13:00'}
                            onChange={(e) => handleUpdateTime(day.value, 'lunch_start', e.target.value)}
                            disabled={isSaving}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Fin</label>
                        <div className="relative">
                          <Icons.utensils className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="time"
                            value={dayAvailability.lunch_end || '14:00'}
                            onChange={(e) => handleUpdateTime(day.value, 'lunch_end', e.target.value)}
                            disabled={isSaving}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="pt-2 border-t">
                    <label className="block text-xs text-gray-600 mb-2">Plantillas rápidas:</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          handleUpdateTime(day.value, 'start_time', '08:00')
                          handleUpdateTime(day.value, 'end_time', '17:00')
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        8:00 - 17:00
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateTime(day.value, 'start_time', '09:00')
                          handleUpdateTime(day.value, 'end_time', '18:00')
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        9:00 - 18:00
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateTime(day.value, 'start_time', '10:00')
                          handleUpdateTime(day.value, 'end_time', '19:00')
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        10:00 - 19:00
                      </button>
                    </div>
                  </div>

                  {isSaving && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      Guardando...
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer Tips */}
      <div className="p-4 bg-blue-50 border-t">
        <div className="flex items-start gap-3">
          <Icons.info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Consejos:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Activa los días en los que estarás disponible para atender pacientes</li>
              <li>Define tu horario de almuerzo para que no se agenden citas en ese tiempo</li>
              <li>Los pacientes solo podrán reservar en los horarios que marques como disponibles</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
