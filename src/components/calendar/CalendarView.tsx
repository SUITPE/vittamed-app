'use client'

import { useState } from 'react'
import { Icons } from '@/components/ui/Icons'

interface Appointment {
  id: string
  appointment_date: string
  patient_name: string
  service_name: string
  start_time: string
  end_time: string
  status: string
  doctor_id: string
  doctor_name?: string
}

interface CalendarViewProps {
  appointments: Appointment[]
  selectedDate: Date
  onDateChange: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
}

export default function CalendarView({
  appointments,
  selectedDate,
  onDateChange,
  onAppointmentClick
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate)

  const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days in the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getAppointmentsForDay = (date: Date | null) => {
    if (!date) return []

    // Build date string in YYYY-MM-DD format
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    return appointments.filter(apt => {
      // appointment_date is already in YYYY-MM-DD format
      return apt.appointment_date === dateStr
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-400',
      confirmed: 'bg-green-500',
      completed: 'bg-blue-500',
      cancelled: 'bg-red-400'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-400'
  }

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentMonth(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentMonth(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    onDateChange(today)
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelectedDate = (date: Date | null) => {
    if (!date) return false
    return date.toDateString() === selectedDate.toDateString()
  }

  const days = getDaysInMonth(currentMonth)

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 capitalize">
            {getMonthName(currentMonth)}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={goToPreviousMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Icons.chevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Icons.chevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            const dayAppointments = getAppointmentsForDay(date)
            const hasAppointments = dayAppointments.length > 0

            return (
              <div
                key={index}
                onClick={() => date && onDateChange(date)}
                className={`
                  min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all
                  ${!date ? 'bg-gray-50 cursor-default' : 'hover:border-blue-400 hover:shadow-md'}
                  ${isToday(date) ? 'border-2 border-blue-500' : 'border-gray-200'}
                  ${isSelectedDate(date) ? 'bg-blue-50 border-blue-400' : 'bg-white'}
                `}
              >
                {date && (
                  <>
                    {/* Day number */}
                    <div className={`
                      text-sm font-semibold mb-1
                      ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}
                    `}>
                      {date.getDate()}
                    </div>

                    {/* Appointments indicators */}
                    {hasAppointments && (
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 3).map((apt) => (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              onAppointmentClick?.(apt)
                            }}
                            className={`
                              text-xs p-1 rounded text-white truncate
                              ${getStatusColor(apt.status)}
                              hover:opacity-80 transition-opacity
                            `}
                            title={`${apt.patient_name} - ${apt.service_name}`}
                          >
                            {new Date(apt.start_time).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} {apt.patient_name}
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-xs text-gray-500 font-medium">
                            +{dayAppointments.length - 3} más
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span className="text-gray-600">Pendiente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Confirmada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Completada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-400 rounded"></div>
            <span className="text-gray-600">Cancelada</span>
          </div>
        </div>
      </div>
    </div>
  )
}
