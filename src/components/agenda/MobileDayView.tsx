'use client'

import { useEffect, useRef } from 'react'
import { Icons } from '@/components/ui/Icons'

interface AppointmentDetails {
  id: string
  patientName: string
  serviceName: string
  status: string
}

interface TimeSlot {
  hour: number
  isAvailable: boolean
  hasAppointment?: boolean
  appointmentDetails?: AppointmentDetails
  // Support for multiple appointments (overbooking)
  appointmentCount?: number
  allAppointments?: AppointmentDetails[]
}

interface MobileDayViewProps {
  date: Date
  availability: any[]
  appointments: any[]
  onSlotClick: (date: Date, hour: number, appointmentId?: string) => void
  onPreviousDay: () => void
  onNextDay: () => void
  onToday: () => void
}

export default function MobileDayView({
  date,
  availability,
  appointments,
  onSlotClick,
  onPreviousDay,
  onNextDay,
  onToday
}: MobileDayViewProps) {
  const dayOfWeek = date.getDay()
  const dayAvailability = availability.find(a => a.day_of_week === dayOfWeek)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const currentHourRef = useRef<HTMLDivElement>(null)

  // Generate time slots for the day - SHOW ALL SLOTS
  const timeSlots: TimeSlot[] = []
  for (let hour = 7; hour <= 20; hour++) {
    const isInWorkHours = dayAvailability &&
      hour >= parseInt(dayAvailability.start_time?.split(':')[0] || '9') &&
      hour < parseInt(dayAvailability.end_time?.split(':')[0] || '17')

    const isLunchHour = dayAvailability?.lunch_start && dayAvailability?.lunch_end &&
      hour >= parseInt(dayAvailability.lunch_start.split(':')[0]) &&
      hour < parseInt(dayAvailability.lunch_end.split(':')[0])

    // Check for ALL appointments in this slot (support overbooking)
    const dateStr = date.toISOString().split('T')[0]
    const slotAppointments = appointments.filter(apt => {
      const aptDate = apt.appointment_date || apt.start_time?.split('T')[0]
      const timeStr = apt.start_time?.includes('T')
        ? apt.start_time.split('T')[1]
        : apt.start_time
      const aptHour = parseInt(timeStr?.split(':')[0] || '0')
      return aptDate === dateStr && aptHour === hour
    })

    const allAppointments: AppointmentDetails[] = slotAppointments.map(apt => ({
      id: apt.id,
      patientName: apt.patient_name,
      serviceName: apt.service_name,
      status: apt.status
    }))

    timeSlots.push({
      hour,
      isAvailable: isInWorkHours && !isLunchHour,
      hasAppointment: slotAppointments.length > 0,
      appointmentDetails: allAppointments[0],
      appointmentCount: slotAppointments.length,
      allAppointments
    })
  }

  useEffect(() => {
    if (currentHourRef.current && scrollContainerRef.current && isToday()) {
      const offset = 100
      const elementPosition = currentHourRef.current.offsetTop
      scrollContainerRef.current.scrollTop = elementPosition - offset
    }
  }, [date])

  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`
  }

  const isToday = () => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      confirmed: { label: 'Confirmada', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      completed: { label: 'Completada', className: 'bg-green-100 text-green-700 border-green-200' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-700 border-red-200' }
    }
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' }
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${badge.className}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onPreviousDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Icons.chevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center flex-1">
            <div className="text-lg font-semibold text-gray-900">{formatDate(date)}</div>
            {isToday() && <div className="text-xs text-blue-600 font-medium mt-1">Hoy</div>}
          </div>
          <button onClick={onNextDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Icons.chevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <button onClick={onToday} className="w-full px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
          Ir a hoy
        </button>
      </div>

      <div ref={scrollContainerRef} className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {timeSlots.length === 0 ? (
          <div className="text-center py-12">
            <Icons.calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay horario configurado para este día</p>
          </div>
        ) : (
          timeSlots.map((slot) => {
            const startTime = slot.hour.toString().padStart(2, '0') + ':00'
            const endTime = (slot.hour + 1).toString().padStart(2, '0') + ':00'
            const now = new Date()
            const isCurrentHour = isToday() && now.getHours() === slot.hour

            if (slot.hasAppointment && slot.appointmentDetails) {
              const isOverbooking = slot.appointmentCount && slot.appointmentCount > 1
              const borderColor = isOverbooking ? 'border-amber-300' : 'border-blue-200'
              const bgColor = isOverbooking ? 'bg-amber-50 hover:bg-amber-100' : 'bg-blue-50 hover:bg-blue-100'
              const iconColor = isOverbooking ? 'text-amber-600' : 'text-blue-600'
              const ringColor = isCurrentHour ? (isOverbooking ? 'ring-2 ring-amber-400' : 'ring-2 ring-blue-400') : ''

              return (
                <div key={slot.hour} ref={isCurrentHour ? currentHourRef : null} className="relative">
                  {isCurrentHour && <div className={`absolute -left-2 top-0 bottom-0 w-1 ${isOverbooking ? 'bg-amber-600' : 'bg-blue-600'} rounded-full`}></div>}
                  <button onClick={() => onSlotClick(date, slot.hour, slot.appointmentDetails?.id)} className={`w-full text-left p-4 rounded-lg border-2 ${borderColor} ${bgColor} transition-colors ${ringColor}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icons.clock className={`w-4 h-4 ${iconColor}`} />
                        <span className="text-sm font-semibold text-gray-900">{startTime} - {endTime}</span>
                        {isCurrentHour && <span className={`text-xs font-bold ${iconColor} animate-pulse`}>AHORA</span>}
                        {isOverbooking && <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{slot.appointmentCount}</span>}
                      </div>
                      {getStatusBadge(slot.appointmentDetails.status)}
                    </div>
                    <div className="ml-6">
                      <div className="font-medium text-gray-900 mb-1">{slot.appointmentDetails.patientName}</div>
                      <div className="text-sm text-gray-600">{slot.appointmentDetails.serviceName}</div>
                      {isOverbooking && <div className="text-xs text-amber-700 mt-1">+{slot.appointmentCount! - 1} cita(s) más en este horario</div>}
                    </div>
                  </button>
                </div>
              )
            } else if (slot.isAvailable) {
              return (
                <div key={slot.hour} ref={isCurrentHour ? currentHourRef : null} className="relative">
                  {isCurrentHour && <div className="absolute -left-2 top-0 bottom-0 w-1 bg-green-600 rounded-full"></div>}
                  <button onClick={() => onSlotClick(date, slot.hour)} className={`w-full text-left p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors ${isCurrentHour ? 'ring-2 ring-green-400' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icons.clock className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">{startTime} - {endTime}</span>
                        {isCurrentHour && <span className="text-xs font-bold text-green-600 animate-pulse">AHORA</span>}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                        <Icons.checkCircle className="w-4 h-4" />Disponible
                      </span>
                    </div>
                  </button>
                </div>
              )
            } else {
              return (
                <div key={slot.hour} ref={isCurrentHour ? currentHourRef : null} className="relative">
                  {isCurrentHour && <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gray-600 rounded-full"></div>}
                  <div className={`w-full p-4 rounded-lg border border-gray-200 bg-gray-50 opacity-60 ${isCurrentHour ? 'ring-2 ring-gray-400' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icons.clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-500">{startTime} - {endTime}</span>
                        {isCurrentHour && <span className="text-xs font-bold text-gray-600 animate-pulse">AHORA</span>}
                      </div>
                      <span className="text-xs text-gray-500">No disponible</span>
                    </div>
                  </div>
                </div>
              )
            }
          })
        )}
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border-2 border-blue-200 rounded"></div>
            <span className="text-gray-600">Con cita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border-2 border-green-200 rounded"></div>
            <span className="text-gray-600">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-100 border-2 border-amber-300 rounded"></div>
            <span className="text-gray-600">Overbooking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span className="text-gray-600">No disponible</span>
          </div>
        </div>
      </div>
    </div>
  )
}
