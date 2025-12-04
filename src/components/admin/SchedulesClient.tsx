'use client'

import { useState, useMemo, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'

interface Schedule {
  id: string
  doctor_id: string
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

interface TimeBlock {
  day: number
  startTime: string
  endTime: string
}

interface SchedulesClientProps {
  initialSchedules: Schedule[]
  doctors?: Doctor[]
  tenantId: string
}

// Generate time slots every 30 minutes from 6 AM to 10 PM
const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 6; hour <= 21; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 21 && minute === 30) break
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(time)
    }
  }
  return slots
}

const DAYS = [
  { value: 1, name: 'Lun', fullName: 'Lunes' },
  { value: 2, name: 'Mar', fullName: 'Martes' },
  { value: 3, name: 'Mié', fullName: 'Miércoles' },
  { value: 4, name: 'Jue', fullName: 'Jueves' },
  { value: 5, name: 'Vie', fullName: 'Viernes' },
  { value: 6, name: 'Sáb', fullName: 'Sábado' },
  { value: 0, name: 'Dom', fullName: 'Domingo' }
]

const TIME_SLOTS = generateTimeSlots()

export default function SchedulesClient({ initialSchedules, doctors = [], tenantId }: SchedulesClientProps) {
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Auto-select first doctor if available
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctor) {
      setSelectedDoctor(doctors[0].id)
    }
  }, [doctors, selectedDoctor])

  // Load availability when doctor changes
  useEffect(() => {
    if (!selectedDoctor) return

    const slots = new Set<string>()
    const doctorSchedules = initialSchedules.filter(s => s.doctor_id === selectedDoctor)

    doctorSchedules.forEach(schedule => {
      const normalizeTime = (time: string) => time.substring(0, 5)
      const startTime = normalizeTime(schedule.start_time)
      const endTime = normalizeTime(schedule.end_time)

      const startIdx = TIME_SLOTS.indexOf(startTime)
      const endIdx = TIME_SLOTS.indexOf(endTime)

      if (startIdx !== -1 && endIdx !== -1) {
        for (let i = startIdx; i < endIdx; i++) {
          slots.add(`${schedule.day_of_week}-${TIME_SLOTS[i]}`)
        }
      }
    })

    setSelectedSlots(slots)
    setHasChanges(false)
  }, [selectedDoctor, initialSchedules])

  // Stats calculations
  const stats = useMemo(() => {
    const doctorsWithSchedules = new Set(initialSchedules.map(s => s.doctor_id))
    const totalBlocks = initialSchedules.length
    const totalHours = initialSchedules.reduce((acc, s) => {
      const start = parseInt(s.start_time.split(':')[0]) + parseInt(s.start_time.split(':')[1]) / 60
      const end = parseInt(s.end_time.split(':')[0]) + parseInt(s.end_time.split(':')[1]) / 60
      return acc + (end - start)
    }, 0)

    return {
      doctorsWithSchedules: doctorsWithSchedules.size,
      totalDoctors: doctors.length,
      totalBlocks,
      totalHours: Math.round(totalHours)
    }
  }, [initialSchedules, doctors])

  const isSlotSelected = (day: number, time: string) => {
    return selectedSlots.has(`${day}-${time}`)
  }

  const toggleSlot = (day: number, time: string) => {
    const slotKey = `${day}-${time}`
    const newSlots = new Set(selectedSlots)

    if (newSlots.has(slotKey)) {
      newSlots.delete(slotKey)
    } else {
      newSlots.add(slotKey)
    }

    setSelectedSlots(newSlots)
    setHasChanges(true)
  }

  const handleMouseDown = (day: number, time: string) => {
    setIsDragging(true)
    toggleSlot(day, time)
  }

  const handleMouseEnter = (day: number, time: string) => {
    if (isDragging) {
      toggleSlot(day, time)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const convertSlotsToBlocks = (): TimeBlock[] => {
    const blocks: TimeBlock[] = []

    DAYS.forEach(day => {
      const daySlots = TIME_SLOTS.filter(time => isSlotSelected(day.value, time))

      if (daySlots.length === 0) return

      let blockStart = daySlots[0]
      let prevTime = daySlots[0]

      for (let i = 1; i <= daySlots.length; i++) {
        const currentTime = daySlots[i]
        const prevIdx = TIME_SLOTS.indexOf(prevTime)
        const currentIdx = currentTime ? TIME_SLOTS.indexOf(currentTime) : -1

        if (i === daySlots.length || currentIdx !== prevIdx + 1) {
          const endIdx = TIME_SLOTS.indexOf(prevTime) + 1
          const endTime = endIdx < TIME_SLOTS.length ? TIME_SLOTS[endIdx] : '22:00'

          blocks.push({
            day: day.value,
            startTime: blockStart,
            endTime: endTime
          })

          blockStart = currentTime
        }

        prevTime = currentTime
      }
    })

    return blocks
  }

  const handleSave = async () => {
    if (!selectedDoctor) return

    setSaving(true)
    setSuccessMessage(null)

    try {
      const blocks = convertSlotsToBlocks()

      const response = await fetch(`/api/tenants/${tenantId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: selectedDoctor, blocks })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar')
      }

      setHasChanges(false)
      setSuccessMessage(`Horarios guardados: ${blocks.length} bloques`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error saving availability:', error)
      alert('Error al guardar la disponibilidad. Por favor intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleClearDay = (day: number) => {
    const newSlots = new Set(selectedSlots)
    TIME_SLOTS.forEach(time => {
      newSlots.delete(`${day}-${time}`)
    })
    setSelectedSlots(newSlots)
    setHasChanges(true)
  }

  const handleFillDay = (day: number, startHour: number = 9, endHour: number = 18) => {
    const newSlots = new Set(selectedSlots)
    const startTime = `${startHour.toString().padStart(2, '0')}:00`
    const endTime = `${endHour.toString().padStart(2, '0')}:00`

    const startIdx = TIME_SLOTS.indexOf(startTime)
    const endIdx = TIME_SLOTS.indexOf(endTime)

    if (startIdx !== -1 && endIdx !== -1) {
      for (let i = startIdx; i < endIdx; i++) {
        newSlots.add(`${day}-${TIME_SLOTS[i]}`)
      }
    }

    setSelectedSlots(newSlots)
    setHasChanges(true)
  }

  const handleCopyToAllDays = () => {
    // Find a day that has schedules
    const dayWithSchedule = DAYS.find(day =>
      TIME_SLOTS.some(time => isSlotSelected(day.value, time))
    )

    if (!dayWithSchedule) return

    // Get the schedule from that day
    const templateSlots = TIME_SLOTS.filter(time =>
      isSlotSelected(dayWithSchedule.value, time)
    )

    // Copy to weekdays (Mon-Fri)
    const newSlots = new Set(selectedSlots)
    DAYS.filter(d => d.value >= 1 && d.value <= 5).forEach(day => {
      templateSlots.forEach(time => {
        newSlots.add(`${day.value}-${time}`)
      })
    })

    setSelectedSlots(newSlots)
    setHasChanges(true)
  }

  const formatTime = (time: string) => {
    const [hour] = time.split(':')
    const h = parseInt(hour)
    const period = h >= 12 ? 'PM' : 'AM'
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${displayHour}${period}`
  }

  const selectedDoctorName = doctors.find(d => d.id === selectedDoctor)?.name || ''

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestión de Horarios
        </h1>
        <p className="text-gray-600 mt-1">
          Administra los horarios de disponibilidad de todos los profesionales
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#40C9C6]/10 rounded-lg">
              <Icons.users className="w-6 h-6 text-[#40C9C6]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.doctorsWithSchedules}/{stats.totalDoctors}</div>
              <div className="text-sm text-gray-500">Profesionales configurados</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Icons.calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalBlocks}</div>
              <div className="text-sm text-gray-500">Bloques de horario</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Icons.clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalHours}h</div>
              <div className="text-sm text-gray-500">Horas disponibles/semana</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Icons.checkCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{doctors.length}</div>
              <div className="text-sm text-gray-500">Profesionales totales</div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Selector - Tabs style */}
      {doctors.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Seleccionar Profesional</h2>
            <div className="flex flex-wrap gap-2">
              {doctors.map((doctor) => {
                const hasSchedule = initialSchedules.some(s => s.doctor_id === doctor.id)
                const isSelected = selectedDoctor === doctor.id
                return (
                  <button
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor.id)}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
                      ${isSelected
                        ? 'bg-[#40C9C6] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full ${hasSchedule ? 'bg-green-400' : 'bg-gray-400'}`} />
                    {doctor.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Icons.users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay profesionales registrados</h3>
          <p className="text-gray-500">
            Primero debes registrar profesionales en el sistema antes de configurar sus horarios.
          </p>
        </div>
      )}

      {/* Availability Grid Editor */}
      {selectedDoctor && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Editor Header */}
          <div className="p-4 md:p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Horarios de {selectedDoctorName}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Haz clic o arrastra para marcar los horarios disponibles
                </p>
              </div>
              <div className="flex items-center gap-3">
                {successMessage && (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <Icons.checkCircle className="w-4 h-4" />
                    {successMessage}
                  </span>
                )}
                <button
                  onClick={handleCopyToAllDays}
                  className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all text-sm"
                  title="Copiar horario a días laborables"
                >
                  <Icons.copy className="w-4 h-4 inline mr-1" />
                  Copiar a Lun-Vie
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    hasChanges && !saving
                      ? 'bg-[#40C9C6] text-white hover:bg-[#33a19e] shadow-md'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Icons.loader className="w-4 h-4 animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    <>
                      <Icons.save className="w-4 h-4 inline mr-1" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4 md:p-6">
            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
              <div className="min-w-[900px]">
                {/* Day Headers */}
                <div className="grid grid-cols-8 gap-1 md:gap-2 mb-2">
                  <div className="text-xs font-medium text-gray-500 text-right pr-2 pt-4">Hora</div>
                  {DAYS.map(day => (
                    <div key={day.value} className="text-center">
                      <div className="font-semibold text-gray-900">{day.name}</div>
                      <div className="text-xs text-gray-500 hidden md:block">{day.fullName}</div>
                      <div className="flex gap-1 mt-2 justify-center">
                        <button
                          onClick={() => handleFillDay(day.value, 8, 13)}
                          className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          title="8 AM - 1 PM"
                        >
                          AM
                        </button>
                        <button
                          onClick={() => handleFillDay(day.value, 14, 20)}
                          className="text-xs px-2 py-1 bg-orange-50 text-orange-600 rounded hover:bg-orange-100 transition-colors"
                          title="2 PM - 8 PM"
                        >
                          PM
                        </button>
                        <button
                          onClick={() => handleClearDay(day.value)}
                          className="text-xs px-1.5 py-1 bg-gray-100 text-gray-600 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="Limpiar día"
                        >
                          <Icons.x className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slots Grid */}
                <div className="space-y-0 select-none">
                  {TIME_SLOTS.map((time, idx) => {
                    const showLabel = time.endsWith(':00')
                    return (
                      <div key={time} className="grid grid-cols-8 gap-1 md:gap-2">
                        {/* Time Label */}
                        <div className={`text-xs text-gray-500 text-right pr-2 py-0.5 ${showLabel ? 'font-medium' : ''}`}>
                          {showLabel ? formatTime(time) : ''}
                        </div>

                        {/* Day Slots */}
                        {DAYS.map(day => (
                          <div
                            key={`${day.value}-${time}`}
                            onMouseDown={() => handleMouseDown(day.value, time)}
                            onMouseEnter={() => handleMouseEnter(day.value, time)}
                            className={`
                              h-5 md:h-6 rounded cursor-pointer transition-all border
                              ${isSlotSelected(day.value, time)
                                ? 'bg-[#40C9C6] border-[#33a19e] hover:bg-[#33a19e]'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                              }
                              ${idx % 2 === 0 ? 'border-t-2' : ''}
                            `}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Tips */}
          <div className="p-4 bg-[#40C9C6]/5 border-t border-[#40C9C6]/20 rounded-b-xl">
            <div className="flex items-start gap-3">
              <Icons.info className="w-5 h-5 text-[#40C9C6] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Consejos rápidos:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Haz clic y arrastra para seleccionar múltiples bloques rápidamente</li>
                  <li>Usa los botones AM/PM para llenar medio día automáticamente</li>
                  <li>Copiar a Lun-Vie replica el horario de un día a todos los días laborables</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#40C9C6] border border-[#33a19e]"></div>
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200"></div>
          <span>No disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span>Tiene horario configurado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          <span>Sin horario</span>
        </div>
      </div>
    </>
  )
}
