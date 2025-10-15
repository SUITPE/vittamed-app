'use client'

interface Schedule {
  id: string
  doctor_name: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

interface SchedulesClientProps {
  initialSchedules: Schedule[]
}

export default function SchedulesClient({ initialSchedules }: SchedulesClientProps) {
  const getDayName = (dayOfWeek: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    return days[dayOfWeek]
  }

  return (
    <>
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
          {initialSchedules.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay horarios configurados
            </p>
          ) : (
            <div className="space-y-4">
              {initialSchedules.map((schedule) => (
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
    </>
  )
}
