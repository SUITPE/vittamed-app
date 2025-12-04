'use client'

import React, { useState, useEffect } from 'react'
import { Icons } from '@/components/ui/Icons'

interface Doctor {
  id: string
  first_name: string
  last_name: string
  specialty?: string
}

interface Appointment {
  id: string
  patient_name: string
  service_name: string
  appointment_date: string // "YYYY-MM-DD"
  start_time: string // "HH:MM:SS"
  end_time: string // "HH:MM:SS"
  status: string
  doctor_id: string
  doctor_name?: string
}

interface DoctorAvailability {
  id: string
  doctor_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface WeeklyCalendarViewProps {
  doctors: Doctor[]
  appointments: Appointment[]
  availability?: DoctorAvailability[]
  selectedDate: Date
  onDateChange: (date: Date) => void
  onTimeSlotClick: (event: React.MouseEvent, doctorId: string, time: Date) => void
  onAppointmentClick: (appointment: Appointment) => void
  onAppointmentMove?: (appointmentId: string, newDoctorId: string, newStartTime: Date) => void
  viewMode?: 'day' | '3days' | 'week'
}

export default function WeeklyCalendarView({
  doctors,
  appointments,
  availability = [],
  selectedDate,
  onDateChange,
  onTimeSlotClick,
  onAppointmentClick,
  onAppointmentMove,
  viewMode = 'week'
}: WeeklyCalendarViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [draggedAppointment, setDraggedAppointment] = useState<Appointment | null>(null)
  const [dragOverCell, setDragOverCell] = useState<{ doctorId: string; timeSlot: string } | null>(null)

  // DEBUG: Log appointments received
  useEffect(() => {
    console.log('[WeeklyCalendar] Component received:', {
      selectedDate,
      appointmentsCount: appointments.length,
      appointments: appointments.map(apt => ({
        id: apt.id,
        patient_name: apt.patient_name,
        appointment_date: apt.appointment_date,
        start_time: apt.start_time,
        end_time: apt.end_time,
        doctor_id: apt.doctor_id
      }))
    })
  }, [appointments, selectedDate])

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // Generate time slots from 8:00 to 22:00 (10 PM)
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = 8 + i
    return `${hour.toString().padStart(2, '0')}:00`
  })

  // Calculate step based on view mode
  const getNavigationStep = () => {
    switch (viewMode) {
      case 'day': return 1
      case '3days': return 3
      case 'week': return 1
      default: return 1
    }
  }

  const goToPreviousDay = () => {
    const step = getNavigationStep()
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - step)
    console.log('[WeeklyCalendar] Previous clicked. Current:', selectedDate, 'New:', newDate)
    onDateChange(newDate)
  }

  const goToNextDay = () => {
    const step = getNavigationStep()
    const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + step)
    console.log('[WeeklyCalendar] Next clicked. Current:', selectedDate, 'New:', newDate)
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  // Get the title based on view mode
  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'day':
        return formatDateHeader(selectedDate)
      case '3days':
        const endDate = new Date(selectedDate)
        endDate.setDate(endDate.getDate() + 2)
        return `${formatDateHeader(selectedDate)} - ${formatDateHeader(endDate)}`
      case 'week':
      default:
        return formatDateHeader(selectedDate)
    }
  }

  // Get visible dates based on view mode
  const getVisibleDates = () => {
    const dates: Date[] = []
    switch (viewMode) {
      case 'day':
        dates.push(new Date(selectedDate))
        break
      case '3days':
        for (let i = 0; i < 3; i++) {
          const date = new Date(selectedDate)
          date.setDate(date.getDate() + i)
          dates.push(date)
        }
        break
      case 'week':
      default:
        // Just show selected day in week view (doctors are columns)
        dates.push(new Date(selectedDate))
        break
    }
    return dates
  }

  const visibleDates = getVisibleDates()

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  // Helper function to create a Date from appointment_date + time string
  const createAppointmentDateTime = (dateStr: string, timeStr: string): Date => {
    // dateStr: "2025-09-30", timeStr: "14:00:00"
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes, seconds] = timeStr.split(':').map(Number)
    return new Date(year, month - 1, day, hours, minutes, seconds || 0)
  }

  const getAppointmentsForDoctorAtTime = (doctorId: string, timeSlot: string) => {
    const slotDate = new Date(selectedDate)
    const [hours] = timeSlot.split(':').map(Number)
    slotDate.setHours(hours, 0, 0, 0)

    // Build the selected date string for comparison
    const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

    const filtered = appointments.filter(apt => {
      // Check doctor
      if (apt.doctor_id !== doctorId) {
        return false
      }

      // Check if appointment is on the same date as selected date
      if (apt.appointment_date !== selectedDateStr) {
        return false
      }

      // Create proper Date objects by combining appointment_date + time
      const aptStart = createAppointmentDateTime(apt.appointment_date, apt.start_time)
      const aptEnd = createAppointmentDateTime(apt.appointment_date, apt.end_time)

      // Check if appointment overlaps with this time slot (slot is 1 hour)
      const slotEnd = new Date(slotDate.getTime() + 60 * 60 * 1000)
      const overlaps = aptStart < slotEnd && aptEnd > slotDate

      return overlaps
    })

    // DEBUG: Log filtering details for first few slots
    if (timeSlot === '14:00' || timeSlot === '19:00') {
      console.log(`[WeeklyCalendar] Filtering for doctor=${doctorId}, slot=${timeSlot}:`)
      console.log('  - selectedDateStr:', selectedDateStr)
      console.log('  - totalAppointments:', appointments.length)
      console.log('  - filteredCount:', filtered.length)
      console.log('  - slotDate:', slotDate.toISOString())
      console.log('  - doctor we are looking for:', doctorId)

      appointments.forEach((apt, index) => {
        console.log(`  Appointment ${index + 1}:`, {
          id: apt.id,
          patient: apt.patient_name,
          doctor_id: apt.doctor_id,
          doctor_match: apt.doctor_id === doctorId,
          appointment_date: apt.appointment_date,
          date_match: apt.appointment_date === selectedDateStr,
          start_time: apt.start_time,
          end_time: apt.end_time
        })
      })
    }

    return filtered
  }

  const calculateAppointmentPosition = (appointment: Appointment, timeSlot: string) => {
    // Create proper Date objects by combining appointment_date + time
    const aptStart = createAppointmentDateTime(appointment.appointment_date, appointment.start_time)
    const aptEnd = createAppointmentDateTime(appointment.appointment_date, appointment.end_time)
    const [slotHour] = timeSlot.split(':').map(Number)

    const startHour = aptStart.getHours()
    const startMinute = aptStart.getMinutes()
    const durationMinutes = (aptEnd.getTime() - aptStart.getTime()) / (1000 * 60)

    // Calculate if this is the first slot where appointment should be shown
    const isFirstSlot = startHour === slotHour

    if (!isFirstSlot) return null

    // Calculate offset from slot start (in minutes from slot hour)
    const offsetMinutes = startMinute
    const offsetPercent = (offsetMinutes / 60) * 100

    // Calculate height based on duration (each slot is 1 hour = 60 minutes)
    const heightPercent = (durationMinutes / 60) * 100

    return {
      top: `${offsetPercent}%`,
      height: `${heightPercent}%`
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-400 border-yellow-500',
      confirmed: 'bg-blue-400 border-blue-500',
      completed: 'bg-green-400 border-green-500',
      cancelled: 'bg-red-400 border-red-500'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-400 border-gray-500'
  }

  // Check if a doctor is available at a specific time slot
  const isDoctorAvailableAtSlot = (doctorId: string, timeSlot: string): boolean => {
    // Get day of week for selected date (0 = Sunday, 6 = Saturday)
    const dayOfWeek = selectedDate.getDay()

    // Find availability for this doctor on this day
    const doctorAvailability = availability.filter(a =>
      a.doctor_id === doctorId && a.day_of_week === dayOfWeek
    )

    // If no availability configured for this doctor on this day, return false
    if (doctorAvailability.length === 0) {
      return false
    }

    // Parse the time slot hour
    const [slotHour] = timeSlot.split(':').map(Number)
    const slotMinutes = slotHour * 60 // Convert to minutes for comparison

    // Check if this time slot falls within any availability block
    return doctorAvailability.some(avail => {
      const [startHour, startMin] = avail.start_time.split(':').map(Number)
      const [endHour, endMin] = avail.end_time.split(':').map(Number)
      const startMinutes = startHour * 60 + (startMin || 0)
      const endMinutes = endHour * 60 + (endMin || 0)

      // The slot is available if it starts within the availability window
      // (slot must be >= start and slot + 60 min must be <= end)
      return slotMinutes >= startMinutes && (slotMinutes + 60) <= endMinutes
    })
  }

  // Calculate current time indicator position
  const getCurrentTimePosition = () => {
    if (!isToday) return null

    const hours = currentTime.getHours()
    const minutes = currentTime.getMinutes()

    if (hours < 8 || hours >= 22) return null

    const slotsFromStart = hours - 8
    const minutePercent = (minutes / 60) * 100
    const topPercent = (slotsFromStart * 100) + minutePercent

    return topPercent
  }

  const currentTimePosition = getCurrentTimePosition()

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, appointment: Appointment) => {
    setDraggedAppointment(appointment)
    e.dataTransfer.effectAllowed = 'move'
    // Add a visual cue
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedAppointment(null)
    setDragOverCell(null)
    // Restore opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent, doctorId: string, timeSlot: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCell({ doctorId, timeSlot })
  }

  const handleDragLeave = () => {
    setDragOverCell(null)
  }

  const handleDrop = (e: React.DragEvent, doctorId: string, timeSlot: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedAppointment || !onAppointmentMove) {
      setDraggedAppointment(null)
      setDragOverCell(null)
      return
    }

    // Calculate new start time
    const newDate = new Date(selectedDate)
    const [hours] = timeSlot.split(':').map(Number)
    newDate.setHours(hours, 0, 0, 0)

    // Call the move handler
    onAppointmentMove(draggedAppointment.id, doctorId, newDate)

    setDraggedAppointment(null)
    setDragOverCell(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousDay}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Icons.chevronLeft className="w-5 h-5" />
            </button>
            <div className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {getHeaderTitle()}
            </div>
            <button
              onClick={goToNextDay}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Icons.chevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${doctors.length}, 1fr)` }}>
          {/* Header Row - Doctor Names */}
          <div className="sticky top-0 bg-white z-20 border-b border-gray-200">
            <div className="h-16 border-r border-gray-200"></div>
          </div>
          {doctors.map((doctor) => (
            <div key={doctor.id} className="sticky top-0 bg-white z-20 border-b border-r border-gray-200">
              <div className="h-16 flex flex-col items-center justify-center p-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm mb-1">
                  {doctor.first_name[0]}{doctor.last_name[0]}
                </div>
                <div className="text-xs font-medium text-gray-900 text-center">
                  Dr. {doctor.first_name} {doctor.last_name}
                </div>
                {doctor.specialty && (
                  <div className="text-xs text-gray-500">{doctor.specialty}</div>
                )}
              </div>
            </div>
          ))}

          {/* Time Slots */}
          {timeSlots.map((timeSlot, slotIndex) => (
            <React.Fragment key={`slot-${timeSlot}`}>
              {/* Time Label */}
              <div className="border-r border-b border-gray-200 bg-gray-50 px-2 py-4 text-sm text-gray-600 font-medium">
                {timeSlot}
              </div>

              {/* Doctor Columns */}
              {doctors.map((doctor) => {
                const appointmentsAtTime = getAppointmentsForDoctorAtTime(doctor.id, timeSlot)
                const isDropTarget = dragOverCell?.doctorId === doctor.id && dragOverCell?.timeSlot === timeSlot
                const isAvailable = isDoctorAvailableAtSlot(doctor.id, timeSlot)

                return (
                  <div
                    key={`${doctor.id}-${timeSlot}`}
                    className={`border-r border-b border-gray-100 transition-colors relative min-h-[80px] ${
                      isDropTarget ? 'bg-blue-100 ring-2 ring-blue-400' :
                      !isAvailable ? 'bg-gray-100 cursor-not-allowed' :
                      'hover:bg-blue-50 cursor-pointer'
                    }`}
                    onClick={(e) => {
                      if (!isAvailable) return // Block clicks on unavailable slots
                      const clickDate = new Date(selectedDate)
                      const [hours] = timeSlot.split(':').map(Number)
                      clickDate.setHours(hours, 0, 0, 0)
                      onTimeSlotClick(e, doctor.id, clickDate)
                    }}
                    onDragOver={(e) => isAvailable && handleDragOver(e, doctor.id, timeSlot)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => isAvailable && handleDrop(e, doctor.id, timeSlot)}
                  >
                    {/* Current time indicator */}
                    {slotIndex === 0 && currentTimePosition !== null && (
                      <div
                        className="absolute left-0 right-0 z-10 border-t-2 border-red-500"
                        style={{ top: `${currentTimePosition}%` }}
                      >
                        <div className="absolute -left-2 -top-2 w-4 h-4 bg-red-500 rounded-full"></div>
                      </div>
                    )}

                    {/* Appointments */}
                    {appointmentsAtTime.map((apt) => {
                      const position = calculateAppointmentPosition(apt, timeSlot)
                      if (!position) return null

                      return (
                        <div
                          key={apt.id}
                          draggable
                          className={`absolute left-1 right-1 ${getStatusColor(apt.status)} border-l-4 rounded-md p-2 shadow-sm hover:shadow-md transition-shadow cursor-move overflow-hidden z-10`}
                          style={{
                            top: position.top,
                            height: position.height,
                            minHeight: '60px'
                          }}
                          onDragStart={(e) => handleDragStart(e, apt)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAppointmentClick(apt)
                          }}
                        >
                          <div className="text-xs font-semibold text-gray-900 truncate">
                            {createAppointmentDateTime(apt.appointment_date, apt.start_time).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} - {apt.patient_name}
                          </div>
                          <div className="text-xs text-gray-700 truncate mt-1">
                            {apt.service_name}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
