'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import AdminNavigation from '@/components/AdminNavigation'

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

export default function TenantDashboard() {
  const params = useParams()
  const tenantId = params.tenantId as string

  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weekAppointments: 0,
    monthRevenue: 0,
    activePatients: 0,
    pendingAppointments: 0
  })
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const [tenantInfo, setTenantInfo] = useState<any>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true

    const initDashboard = async () => {
      if (!tenantId || !mounted) return

      try {
        // Check authentication only once
        const hasAuthCookie = document.cookie.includes('sb-mvvxeqhsatkqtsrulcil-auth-token')

        if (!hasAuthCookie) {
          window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
          return
        }

        if (mounted) {
          setIsAuthenticated(true)
          await fetchDashboardData()
        }
      } catch (error) {
        console.error('Dashboard init error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // Only run once when component mounts
    initDashboard()

    return () => {
      mounted = false
    }
  }, []) // Remove tenantId dependency to prevent re-runs

  async function fetchDashboardData() {
    try {
      // Fetch tenant info with error handling
      try {
        const tenantResponse = await fetch('/api/tenants')
        if (tenantResponse.ok) {
          const tenants = await tenantResponse.json()
          const tenant = tenants.find((t: any) => t.id === tenantId)
          if (tenant) {
            setTenantInfo(tenant)
          } else {
            // Fallback tenant info
            setTenantInfo({
              id: tenantId,
              name: 'Clínica Demo',
              tenant_type: 'clínica'
            })
          }
        }
      } catch (error) {
        console.warn('Failed to fetch tenant info, using fallback')
        setTenantInfo({
          id: tenantId,
          name: 'Clínica Demo',
          tenant_type: 'clínica'
        })
      }

      // Get today's date
      const today = new Date().toISOString().split('T')[0]

      // Fetch today's appointments with fallback
      try {
        const appointmentsResponse = await fetch(`/api/dashboard/${tenantId}/appointments?date=${today}`)
        if (appointmentsResponse.ok) {
          const appointments = await appointmentsResponse.json()
          setTodayAppointments(appointments)
        } else {
          setTodayAppointments([])
        }
      } catch (error) {
        console.warn('Failed to fetch appointments, using empty list')
        setTodayAppointments([])
      }

      // Fetch dashboard stats with fallback
      try {
        const statsResponse = await fetch(`/api/dashboard/${tenantId}/stats`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        } else {
          // Keep default stats if fetch fails
          console.warn('Failed to fetch stats, using defaults')
        }
      } catch (error) {
        console.warn('Failed to fetch stats, using defaults')
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation
        currentPath={`/dashboard/${tenantId}`}
        tenantId={tenantId}
      />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard - {tenantInfo?.name}
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión completa de tu {tenantInfo?.tenant_type}
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

        {/* Today's Appointments */}
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
                  onClick={() => window.location.href = '/patients'}
                  className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Gestionar Pacientes</div>
                  <div className="text-sm text-gray-500">Ver y editar información de pacientes</div>
                </button>

                <button
                  onClick={() => window.location.href = '/agenda'}
                  className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Agenda Doctores</div>
                  <div className="text-sm text-gray-500">Configurar horarios y disponibilidad</div>
                </button>

                <button
                  onClick={() => window.location.href = `/dashboard/${tenantId}/reports`}
                  className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Reportes</div>
                  <div className="text-sm text-gray-500">Ver estadísticas y reportes</div>
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}