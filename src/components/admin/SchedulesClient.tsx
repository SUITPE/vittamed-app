'use client'

import { useState } from 'react'
import { Icons } from '@/components/ui/Icons'

interface SchedulableUser {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  specialty?: string
}

interface AvailabilityBlock {
  id: string
  doctor_tenant_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

interface UserWithSchedule {
  user: SchedulableUser
  availability: AvailabilityBlock[]
}

interface SchedulesClientProps {
  usersWithSchedules: UserWithSchedule[]
  tenantId: string
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    doctor: 'Doctor',
    staff: 'Staff',
    member: 'Miembro',
    receptionist: 'Recepcionista',
    admin_tenant: 'Administrador'
  }
  return labels[role] || role
}

const getRoleBadgeColor = (role: string) => {
  const colors: Record<string, string> = {
    doctor: 'bg-blue-100 text-blue-800',
    staff: 'bg-purple-100 text-purple-800',
    member: 'bg-green-100 text-green-800',
    receptionist: 'bg-yellow-100 text-yellow-800',
    admin_tenant: 'bg-red-100 text-red-800'
  }
  return colors[role] || 'bg-gray-100 text-gray-800'
}

export default function SchedulesClient({ usersWithSchedules, tenantId }: SchedulesClientProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  const toggleExpand = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const getScheduleSummary = (availability: AvailabilityBlock[]) => {
    if (availability.length === 0) return 'Sin horario configurado'

    const daysWithSchedule = [...new Set(availability.map(a => a.day_of_week))].sort()
    const dayNames = daysWithSchedule.map(d => DAYS_SHORT[d])

    return `${dayNames.join(', ')} (${availability.length} bloques)`
  }

  const getTotalHours = (availability: AvailabilityBlock[]) => {
    let totalMinutes = 0
    availability.forEach(block => {
      const [startH, startM] = block.start_time.split(':').map(Number)
      const [endH, endM] = block.end_time.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      totalMinutes += endMinutes - startMinutes
    })
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Horarios del Equipo
        </h1>
        <p className="text-gray-600 mt-1">
          Vista consolidada de la disponibilidad de todos los miembros del equipo
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Miembros con agenda</p>
              <p className="text-2xl font-bold text-gray-900">{usersWithSchedules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.checkCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Con horario configurado</p>
              <p className="text-2xl font-bold text-gray-900">
                {usersWithSchedules.filter(u => u.availability.length > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icons.alertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sin configurar</p>
              <p className="text-2xl font-bold text-gray-900">
                {usersWithSchedules.filter(u => u.availability.length === 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icons.list className="w-4 h-4 inline-block mr-1" />
            Lista
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'calendar'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icons.calendar className="w-4 h-4 inline-block mr-1" />
            Calendario
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {usersWithSchedules.length === 0 ? (
            <div className="p-12 text-center">
              <Icons.users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay miembros con agenda
              </h3>
              <p className="text-gray-500">
                No hay usuarios configurados como &quot;schedulable&quot; en este tenant.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {usersWithSchedules.map(({ user, availability }) => (
                <div key={user.id} className="hover:bg-gray-50 transition-colors">
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    onClick={() => toggleExpand(user.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                        {user.first_name[0]}{user.last_name[0]}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {user.specialty || user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`text-sm font-medium ${availability.length > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                          {getScheduleSummary(availability)}
                        </p>
                        {availability.length > 0 && (
                          <p className="text-xs text-gray-500">
                            {getTotalHours(availability)} semanales
                          </p>
                        )}
                      </div>
                      <Icons.chevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedUser === user.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {expandedUser === user.id && (
                    <div className="px-4 pb-4 bg-gray-50">
                      {availability.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4 text-center">
                          Este usuario no tiene horarios configurados.
                          Puede configurar su disponibilidad desde su panel.
                        </p>
                      ) : (
                        <div className="grid grid-cols-7 gap-2 pt-2">
                          {DAYS.map((day, index) => {
                            const dayBlocks = availability.filter(a => a.day_of_week === index)
                            return (
                              <div key={day} className="text-center">
                                <p className="text-xs font-medium text-gray-500 mb-2">{DAYS_SHORT[index]}</p>
                                {dayBlocks.length > 0 ? (
                                  <div className="space-y-1">
                                    {dayBlocks.map(block => (
                                      <div
                                        key={block.id}
                                        className="bg-blue-100 text-blue-800 rounded px-1 py-1 text-xs"
                                      >
                                        {formatTime(block.start_time)}
                                        <br />
                                        {formatTime(block.end_time)}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-gray-100 text-gray-400 rounded px-1 py-2 text-xs">
                                    -
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 border-b">
                    Miembro
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="px-2 py-3 text-center text-sm font-medium text-gray-600 border-b min-w-[100px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usersWithSchedules.map(({ user, availability }) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium">
                          {user.first_name[0]}{user.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                        </div>
                      </div>
                    </td>
                    {DAYS.map((_, dayIndex) => {
                      const dayBlocks = availability.filter(a => a.day_of_week === dayIndex)
                      return (
                        <td key={dayIndex} className="px-2 py-2 text-center">
                          {dayBlocks.length > 0 ? (
                            <div className="space-y-1">
                              {dayBlocks.map(block => (
                                <div
                                  key={block.id}
                                  className="bg-green-100 text-green-800 rounded px-1 py-0.5 text-xs"
                                >
                                  {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
