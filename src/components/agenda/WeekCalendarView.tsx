'use client'

import { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'

interface TimeSlot {
  hour: number
  isAvailable: boolean
  hasAppointment?: boolean
  appointmentDetails?: {
    patientName: string
    serviceName: string
    status: string
  }
}

interface DaySchedule {
  date: Date
  dayName: string
  dayNumber: number
  isToday: boolean
  isAvailable: boolean
  slots: TimeSlot[]
}

interface WeekCalendarViewProps {
  startDate: Date
  availability: any[]
  appointments: any[]
  onSlotClick: (date: Date, hour: number) => void
  onDateChange: (date: Date) => void
}

export default function WeekCalendarView({
  startDate,
  availability,
  appointments,
  onSlotClick,
  onDateChange
}: WeekCalendarViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(startDate))
  const [weekDays, setWeekDays] = useState<DaySchedule[]>([])

  useEffect(() => {
    generateWeekDays()
  }, [currentWeekStart, availability, appointments])

  function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
    return new Date(d.setDate(diff))
  }

  function generateWeekDays() {
    const days: DaySchedule[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)

      const dayOfWeek = date.getDay()
      const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek)

      const slots: TimeSlot[] = []

      // Generate hourly slots from 7 AM to 8 PM
      for (let hour = 7; hour <= 20; hour++) {
        const isInWorkHours = dayAvailability &&
          hour >= parseInt(dayAvailability.start_time?.split(':')[0] || '9') &&
          hour < parseInt(dayAvailability.end_time?.split(':')[0] || '17')

        const isLunchHour = dayAvailability?.lunch_start && dayAvailability?.lunch_end &&
          hour >= parseInt(dayAvailability.lunch_start.split(':')[0]) &&
          hour < parseInt(dayAvailability.lunch_end.split(':')[0])

        // Check for appointments in this slot
        const dateStr = date.toISOString().split('T')[0]
        const appointment = appointments.find(apt => {
          const aptDate = apt.appointment_date || apt.start_time?.split('T')[0]
          const aptHour = parseInt(apt.start_time?.split('T')[1]?.split(':')[0] || '0')
          return aptDate === dateStr && aptHour === hour
        })

        slots.push({
          hour,
          isAvailable: isInWorkHours && !isLunchHour,
          hasAppointment: !!appointment,
          appointmentDetails: appointment ? {
            patientName: appointment.patient_name,
            serviceName: appointment.service_name,
            status: appointment.status
          } : undefined
        })
      }

      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

      days.push({
        date,
        dayName: dayNames[dayOfWeek],
        dayNumber: date.getDate(),
        isToday: date.getTime() === today.getTime(),
        isAvailable: !!dayAvailability,
        slots
      })
    }

    setWeekDays(days)
  }

  function goToPreviousWeek() {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeekStart(newDate)
    onDateChange(newDate)
  }

  function goToNextWeek() {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeekStart(newDate)
    onDateChange(newDate)
  }

  function goToToday() {
    const today = getWeekStart(new Date())
    setCurrentWeekStart(today)
    onDateChange(today)
  }

  const monthYear = currentWeekStart.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 capitalize">
            {monthYear}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Hoy
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icons.chevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icons.chevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b">
            <div className="p-3 text-sm font-medium text-gray-500">Hora</div>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={`p-3 text-center border-l ${
                  day.isToday ? 'bg-blue-50' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-600">
                  {day.dayName}
                </div>
                <div className={`text-2xl font-bold mt-1 ${
                  day.isToday
                    ? 'bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto'
                    : 'text-gray-900'
                }`}>
                  {day.dayNumber}
                </div>
                {!day.isAvailable && (
                  <div className="text-xs text-gray-400 mt-1">No disponible</div>
                )}
              </div>
            ))}
          </div>

          {/* Time Slots Grid */}
          <div className="divide-y">
            {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => (
              <div key={hour} className="grid grid-cols-8">
                {/* Hour Label */}
                <div className="p-3 text-sm text-gray-500 font-medium">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Day Slots */}
                {weekDays.map((day, dayIndex) => {
                  const slot = day.slots.find(s => s.hour === hour)

                  return (
                    <button
                      key={dayIndex}
                      onClick={() => onSlotClick(day.date, hour)}
                      disabled={!slot?.isAvailable && !slot?.hasAppointment}
                      className={`p-2 border-l min-h-[60px] text-left transition-all relative group ${
                        day.isToday ? 'bg-blue-50/30' : ''
                      } ${
                        slot?.hasAppointment
                          ? getAppointmentColor(slot.appointmentDetails?.status || '')
                          : slot?.isAvailable
                          ? 'hover:bg-green-50 cursor-pointer'
                          : 'bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      {slot?.hasAppointment && (
                        <div className="text-xs">
                          <div className="font-medium text-gray-900 truncate">
                            {slot.appointmentDetails?.patientName}
                          </div>
                          <div className="text-gray-600 truncate">
                            {slot.appointmentDetails?.serviceName}
                          </div>
                        </div>
                      )}

                      {slot?.isAvailable && !slot?.hasAppointment && (
                        <div className="opacity-0 group-hover:opacity-100 text-xs text-green-600 font-medium">
                          Disponible
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-gray-600">Confirmada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span className="text-gray-600">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-gray-600">No disponible</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function getAppointmentColor(status: string): string {
  switch (status) {
    case 'confirmed':
      return 'bg-blue-100 border-l-4 border-blue-500'
    case 'pending':
      return 'bg-yellow-100 border-l-4 border-yellow-500'
    case 'completed':
      return 'bg-green-100 border-l-4 border-green-500'
    case 'cancelled':
      return 'bg-red-100 border-l-4 border-red-500'
    default:
      return 'bg-gray-100 border-l-4 border-gray-500'
  }
}
