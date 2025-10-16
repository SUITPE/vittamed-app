'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BUSINESS_TYPE_CONFIGS, BusinessType } from '@/types/business'

interface DashboardStats {
  todayAppointments: number
  weekAppointments: number
  monthRevenue: number
  activePatients: number
  pendingAppointments: number
}

interface TodayAppointment {
  id: string
  patient_name: string
  doctor_name: string
  service_name: string
  start_time: string
  status: string
}

interface TenantInfo {
  id: string
  name: string
  tenant_type: string
}

interface DashboardClientProps {
  tenantId: string
  tenantInfo: TenantInfo
  initialStats: DashboardStats
  initialAppointments: TodayAppointment[]
}

export default function DashboardClient({
  tenantId,
  tenantInfo,
  initialStats,
  initialAppointments
}: DashboardClientProps) {
  const router = useRouter()
  const [stats] = useState<DashboardStats>(initialStats)
  const [todayAppointments] = useState<TodayAppointment[]>(initialAppointments)

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    )
  }

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  // Get business type label in Spanish
  const getBusinessTypeLabel = (type: string) => {
    const config = BUSINESS_TYPE_CONFIGS[type as BusinessType]
    return config ? config.label : type
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard - {tenantInfo?.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Gestión completa de tu {getBusinessTypeLabel(tenantInfo?.tenant_type)}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div data-testid="today-appointments-stat" className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Citas Hoy</div>
          <div className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</div>
        </div>

        <div data-testid="week-appointments-stat" className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Citas Semana</div>
          <div className="text-2xl font-bold text-gray-900">{stats.weekAppointments}</div>
        </div>

        <div data-testid="month-revenue-stat" className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Ingresos Mes</div>
          <div className="text-2xl font-bold text-green-600">${stats.monthRevenue}</div>
        </div>

        <div data-testid="active-patients-stat" className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Pacientes Activos</div>
          <div className="text-2xl font-bold text-gray-900">{stats.activePatients}</div>
        </div>

        <div data-testid="pending-appointments-stat" className="bg-white p-6 rounded-lg shadow-sm">
          <div className="text-sm font-medium text-gray-500">Pendientes</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingAppointments}</div>
        </div>
      </div>

      {/* Today's Appointments & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Citas de Hoy</h2>
          </div>
          <div className="p-6">
            {todayAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No hay citas programadas para hoy
              </p>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {appointment.patient_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.service_name} - Dr. {appointment.doctor_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.start_time}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Acciones Rápidas</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <button
                onClick={() => window.open('/booking', '_blank')}
                className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Nueva Cita</div>
                <div className="text-sm text-gray-500">Reservar cita para un paciente</div>
              </button>

              <button
                onClick={() => handleNavigation('/patients')}
                className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Gestionar Pacientes</div>
                <div className="text-sm text-gray-500">Ver y editar información de pacientes</div>
              </button>

              <button
                onClick={() => handleNavigation('/agenda')}
                className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Agenda Doctores</div>
                <div className="text-sm text-gray-500">Configurar horarios y disponibilidad</div>
              </button>

              <button
                onClick={() => handleNavigation(`/dashboard/${tenantId}/reports`)}
                className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">Reportes</div>
                <div className="text-sm text-gray-500">Ver estadísticas y reportes</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
