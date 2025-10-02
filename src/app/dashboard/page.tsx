'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user?.profile) {
      console.log('🔍 Dashboard redirect - User profile:', {
        role: user.profile.role,
        tenant_id: user.profile.tenant_id,
        email: user.email
      })

      // Redirect based on user role
      switch (user.profile.role) {
        case 'admin_tenant':
        case 'staff':
        case 'receptionist':
          if (user.profile.tenant_id) {
            console.log('✅ Redirecting to dashboard with tenant:', user.profile.tenant_id)
            window.location.href = `/dashboard/${user.profile.tenant_id}`
          } else {
            console.log('⚠️ No tenant_id, redirecting to create-tenant')
            window.location.href = '/admin/create-tenant'
          }
          break
        case 'doctor':
          console.log('✅ Redirecting doctor to agenda')
          window.location.href = '/agenda'
          break
        case 'patient':
          console.log('✅ Redirecting patient to appointments')
          window.location.href = '/my-appointments'
          break
        default:
          console.log('❌ Unknown role, redirecting to login')
          window.location.href = '/auth/login'
      }
    } else if (!loading && !user) {
      console.log('❌ No user found, redirecting to login')
      window.location.href = '/auth/login'
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirigiendo a tu dashboard...</p>
      </div>
    </div>
  )
}