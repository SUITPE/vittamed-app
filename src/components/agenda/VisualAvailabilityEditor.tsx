'use client'

import { useState, useEffect, useRef } from 'react'
import { Icons } from '@/components/ui/Icons'

interface TimeBlock {
  day: number
  startTime: string
  endTime: string
}

interface VisualAvailabilityEditorProps {
  availability: Array<{
    id?: string
    day_of_week: number
    start_time: string
    end_time: string
  }>
  onUpdate: (blocks: TimeBlock[]) => Promise<void>
}

// Generate time slots every 30 minutes from 6 AM to 10 PM
const generateTimeSlots = () => {
  const slots: string[] = []
  for (let hour = 6; hour <= 21; hour++) {
    for (const minute of [0, 30]) {
      if (hour === 21 && minute === 30) break // Stop at 10 PM
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

export default function VisualAvailabilityEditor({
  availability,
  onUpdate
}: VisualAvailabilityEditorProps) {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartSlot, setDragStartSlot] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize selected slots from availability data
  useEffect(() => {
    const slots = new Set<string>()
    availability.forEach(block => {
      // Normalize time format (remove seconds if present)
      const normalizeTime = (time: string) => time.substring(0, 5)

      const startTime = normalizeTime(block.start_time)
      const endTime = normalizeTime(block.end_time)

      const startIdx = TIME_SLOTS.indexOf(startTime)
      const endIdx = TIME_SLOTS.indexOf(endTime)

      console.log('📅 Loading availability block:', {
        day: block.day_of_week,
        start: startTime,
        end: endTime,
        startIdx,
        endIdx
      })

      if (startIdx !== -1 && endIdx !== -1) {
        for (let i = startIdx; i < endIdx; i++) {
          slots.add(`${block.day_of_week}-${TIME_SLOTS[i]}`)
        }
      } else {
        console.warn('⚠️ Time slot not found:', { startTime, endTime, startIdx, endIdx })
      }
    })
    console.log('✅ Loaded slots:', slots.size)
    setSelectedSlots(slots)
    setHasChanges(false) // Reset changes flag when loading data
  }, [availability])

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
    setDragStartSlot(`${day}-${time}`)
    toggleSlot(day, time)
  }

  const handleMouseEnter = (day: number, time: string) => {
    if (isDragging) {
      toggleSlot(day, time)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStartSlot(null)
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

      // Group consecutive slots into blocks
      let blockStart = daySlots[0]
      let prevTime = daySlots[0]

      for (let i = 1; i <= daySlots.length; i++) {
        const currentTime = daySlots[i]
        const prevIdx = TIME_SLOTS.indexOf(prevTime)
        const currentIdx = currentTime ? TIME_SLOTS.indexOf(currentTime) : -1

        // If not consecutive or end of array, save the block
        if (i === daySlots.length || currentIdx !== prevIdx + 1) {
          // Calculate end time (30 min after last slot)
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
    setSaving(true)
    try {
      const blocks = convertSlotsToBlocks()
      console.log('💾 Saving availability blocks:', { blockCount: blocks.length, blocks })
      await onUpdate(blocks)
      console.log('✅ Availability saved successfully')
      setHasChanges(false)
    } catch (error) {
      console.error('❌ Error saving availability:', error)
      alert('Error al guardar la disponibilidad. Por favor revisa la consola.')
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

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':')
    const h = parseInt(hour)
    const period = h >= 12 ? 'PM' : 'AM'
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return minute === '00' ? `${displayHour}${period}` : ''
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 md:p-6 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configurar Disponibilidad
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Haz clic o arrastra para marcar tus horarios disponibles
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              hasChanges && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Icons.loader className="w-4 h-4 animate-spin" />
                Guardando...
              </span>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 md:p-6">
        <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-xs font-medium text-gray-500 text-right pr-2">Hora</div>
              {DAYS.map(day => (
                <div key={day.value} className="text-center">
                  <div className="font-semibold text-gray-900">{day.name}</div>
                  <div className="text-xs text-gray-500">{day.fullName}</div>
                  <div className="flex gap-1 mt-2 justify-center">
                    <button
                      onClick={() => handleFillDay(day.value, 9, 18)}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      title="9 AM - 6 PM"
                    >
                      9-6
                    </button>
                    <button
                      onClick={() => handleClearDay(day.value)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
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
              {TIME_SLOTS.map((time, idx) => (
                <div key={time} className="grid grid-cols-8 gap-2">
                  {/* Time Label */}
                  <div className={`text-xs text-gray-500 text-right pr-2 py-1 ${
                    formatTime(time) ? 'font-medium' : ''
                  }`}>
                    {formatTime(time)}
                  </div>

                  {/* Day Slots */}
                  {DAYS.map(day => (
                    <div
                      key={`${day.value}-${time}`}
                      onMouseDown={() => handleMouseDown(day.value, time)}
                      onMouseEnter={() => handleMouseEnter(day.value, time)}
                      className={`
                        h-6 rounded cursor-pointer transition-all border
                        ${isSlotSelected(day.value, time)
                          ? 'bg-blue-500 border-blue-600 hover:bg-blue-600'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }
                        ${idx % 2 === 0 ? 'border-t-2' : ''}
                      `}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Tips */}
      <div className="p-4 bg-blue-50 border-t">
        <div className="flex items-start gap-3">
          <Icons.info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Consejos:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Haz clic en un bloque para marcarlo como disponible</li>
              <li>Arrastra el mouse para seleccionar múltiples bloques rápidamente</li>
              <li>Usa los botones "9-6" para llenar un horario típico de oficina</li>
              <li>Los pacientes solo podrán agendar en los bloques marcados</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
