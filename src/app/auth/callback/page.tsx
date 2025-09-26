'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'

export default function AuthCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current user after OAuth redirect
        const user = await authService.getCurrentUser()

        if (user) {
          // Redirect based on user role
          if (user.profile?.role === 'admin_tenant') {
            router.push(`/dashboard/${user.profile.tenant_id}`)
          } else if (user.profile?.role === 'doctor') {
            router.push('/agenda')
          } else if (user.profile?.role === 'patient') {
            router.push('/my-appointments')
          } else {
            router.push('/dashboard')
          }
        } else {
          // If no user, redirect to login with error
          router.push('/auth/login?error=oauth_failed')
        }
      } catch (err) {
        console.error('OAuth callback error:', err)
        setError('Error durante el proceso de autenticación')
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                Completando autenticación...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Por favor espera mientras procesamos tu login
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">✗</div>
              <h2 className="text-lg font-medium text-gray-900">
                Error de Autenticación
              </h2>
              <p className="mt-2 text-sm text-red-600">
                {error}
              </p>
              <p className="mt-4 text-xs text-gray-500">
                Redirigiendo al login...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}