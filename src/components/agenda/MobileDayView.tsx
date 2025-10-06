'use client'

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

interface MobileDayViewProps {
  date: Date
  availability: any[]
  appointments: any[]
  onSlotClick: (date: Date, hour: number) => void
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

  // Generate time slots for the day
  const timeSlots: TimeSlot[] = []
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

    // Only show slots that are available or have appointments
    if (isInWorkHours && !isLunchHour || appointment) {
      timeSlots.push({
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
  }

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
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onPreviousDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icons.chevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center flex-1">
            <div className="text-lg font-semibold text-gray-900">
              {formatDate(date)}
            </div>
            {isToday() && (
              <div className="text-xs text-blue-600 font-medium mt-1">Hoy</div>
            )}
          </div>

          <button
            onClick={onNextDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icons.chevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <button
          onClick={onToday}
          className="w-full px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        >
          Ir a hoy
        </button>
      </div>

      {/* Time Slots List */}
      <div className="p-4 space-y-3">
        {timeSlots.length === 0 ? (
          <div className="text-center py-12">
            <Icons.calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No hay disponibilidad para este día</p>
          </div>
        ) : (
          timeSlots.map((slot) => {
            const startTime = slot.hour.toString().padStart(2, '0') + ':00'
            const endTime = (slot.hour + 1).toString().padStart(2, '0') + ':00'

            if (slot.hasAppointment && slot.appointmentDetails) {
              // Appointment Card
              return (
                <button
                  key={slot.hour}
                  onClick={() => onSlotClick(date, slot.hour)}
                  className="w-full text-left p-4 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icons.clock className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-gray-900">
                        {startTime} - {endTime}
                      </span>
                    </div>
                    {getStatusBadge(slot.appointmentDetails.status)}
                  </div>
                  <div className="ml-6">
                    <div className="font-medium text-gray-900 mb-1">
                      {slot.appointmentDetails.patientName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {slot.appointmentDetails.serviceName}
                    </div>
                  </div>
                </button>
              )
            } else if (slot.isAvailable) {
              // Available Slot
              return (
                <button
                  key={slot.hour}
                  onClick={() => onSlotClick(date, slot.hour)}
                  className="w-full text-left p-4 rounded-lg border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icons.clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {startTime} - {endTime}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                      <Icons.checkCircle className="w-4 h-4" />
                      Disponible
                    </span>
                  </div>
                </button>
              )
            }
            return null
          })
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border-2 border-blue-200 rounded"></div>
            <span className="text-gray-600">Con cita</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border-2 border-green-200 rounded"></div>
            <span className="text-gray-600">Disponible</span>
          </div>
        </div>
      </div>
    </div>
  )
}
