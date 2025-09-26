'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import ClientNavigation from '@/components/ClientNavigation'

interface Payment {
  id: string
  appointment_id: string
  service_name: string
  doctor_name: string
  tenant_name: string
  amount: number
  status: string
  payment_method: string
  transaction_id?: string
  created_at: string
  paid_at?: string
  invoice_url?: string
}

export default function ClientPaymentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('')
  const [error, setError] = useState('')

  // Check if user is client
  const isClient = user?.profile?.role === 'client'

  useEffect(() => {
    if (!loading && (!user || user.profile?.role !== 'client')) {
      router.push('/auth/login')
      return
    }

    if (user && isClient) {
      fetchMyPayments()
    }
  }, [user, loading, router, isClient])

  async function fetchMyPayments() {
    try {
      setLoadingData(true)
      setError('')

      // Fetch payments for this client across all tenants
      let url = `/api/clients/${user?.id}/payments`
      const params = new URLSearchParams()

      if (selectedStatus) params.append('status', selectedStatus)
      if (selectedTimeRange) params.append('timeRange', selectedTimeRange)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)

      if (response.ok) {
        const paymentsData = await response.json()

        // Sort by created_at (most recent first)
        const sortedPayments = (paymentsData || []).sort((a: Payment, b: Payment) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        setPayments(sortedPayments)
      } else {
        console.warn('Could not fetch payments')
        setPayments([])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      setError('Error al cargar mis pagos')
    } finally {
      setLoadingData(false)
    }
  }

  // Refresh when filters change
  useEffect(() => {
    if (user && isClient) {
      fetchMyPayments()
    }
  }, [selectedStatus, selectedTimeRange])

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    const statusLabels = {
      pending: 'Pendiente',
      paid: 'Pagado',
      failed: 'Falló',
      refunded: 'Reembolsado',
      cancelled: 'Cancelado'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const getMethodIcon = (method: string) => {
    const icons = {
      card: '💳',
      cash: '💵',
      transfer: '🏧',
      stripe: '💳'
    }
    return icons[method as keyof typeof icons] || '💳'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientNavigation currentPath="/client/payments" />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando mis pagos...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Acceso Restringido
              </h2>
              <p className="text-gray-600">
                Solo los clientes pueden acceder a esta página.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavigation currentPath="/client/payments" />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              💳 Mis Pagos
            </h1>
            <p className="text-gray-600 mt-1">
              Historial completo de pagos y facturas médicas
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Pagado</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">⏳</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pendiente</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(pendingAmount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Transacciones</p>
                  <p className="text-2xl font-semibold text-gray-900">{payments.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del Pago
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Todos los estados</option>
                    <option value="paid">Pagados</option>
                    <option value="pending">Pendientes</option>
                    <option value="failed">Fallidos</option>
                    <option value="refunded">Reembolsados</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período
                  </label>
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Todos los períodos</option>
                    <option value="last7days">Últimos 7 días</option>
                    <option value="last30days">Últimos 30 días</option>
                    <option value="last3months">Últimos 3 meses</option>
                    <option value="lastyear">Último año</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Payments List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Historial de Pagos ({payments.length})
              </h2>
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg mb-4">
                  No tienes pagos registrados
                </div>
                <p className="text-sm text-gray-400">
                  Tus pagos aparecerán aquí después de realizar tu primera transacción
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">
                          {getMethodIcon(payment.payment_method)}
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {payment.service_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Dr. {payment.doctor_name} - {payment.tenant_name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(payment.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {formatCurrency(payment.amount)}
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Método de Pago:</p>
                        <p className="text-gray-900 capitalize">{payment.payment_method}</p>
                      </div>

                      {payment.transaction_id && (
                        <div>
                          <p className="font-medium text-gray-700">ID Transacción:</p>
                          <p className="text-gray-900 font-mono text-xs">
                            {payment.transaction_id}
                          </p>
                        </div>
                      )}

                      {payment.paid_at && (
                        <div>
                          <p className="font-medium text-gray-700">Fecha de Pago:</p>
                          <p className="text-gray-900">
                            {formatDate(payment.paid_at)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex gap-2">
                      {payment.invoice_url && (
                        <a
                          href={payment.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          📄 Ver Factura
                        </a>
                      )}

                      {payment.status === 'pending' && (
                        <button className="inline-flex items-center px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-md hover:bg-teal-200 transition-colors">
                          💳 Pagar Ahora
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Summary */}
          {payments.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Resumen por Estado
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {payments.filter(p => p.status === 'paid').length}
                    </div>
                    <div className="text-sm text-gray-500">Pagados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {payments.filter(p => p.status === 'pending').length}
                    </div>
                    <div className="text-sm text-gray-500">Pendientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {payments.filter(p => p.status === 'failed').length}
                    </div>
                    <div className="text-sm text-gray-500">Fallidos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {payments.filter(p => p.status === 'refunded').length}
                    </div>
                    <div className="text-sm text-gray-500">Reembolsados</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}