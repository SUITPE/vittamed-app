'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Navigation() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                VittaMed
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              VittaMed
            </Link>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/booking"
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Reservar Cita
              </Link>

              {user && (
                <>
                  {user.profile?.role === 'admin_tenant' && (
                    <Link
                      href={`/dashboard/${user.profile.tenant_id}`}
                      className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Dashboard
                    </Link>
                  )}

                  {user.profile?.role === 'doctor' && (
                    <>
                      <Link
                        href="/agenda"
                        className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Mi Agenda
                      </Link>
                      <Link
                        href="/appointments"
                        className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Mis Citas
                      </Link>
                    </>
                  )}

                  {user.profile?.role === 'patient' && (
                    <Link
                      href="/my-appointments"
                      className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Mis Citas
                    </Link>
                  )}

                  <Link
                    href="/patients"
                    className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Pacientes
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">
                    {user.profile?.first_name} {user.profile?.last_name}
                  </span>
                  {user.profile?.role && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {user.profile.role === 'admin_tenant' && 'Admin'}
                      {user.profile.role === 'doctor' && 'Doctor'}
                      {user.profile.role === 'patient' && 'Paciente'}
                    </span>
                  )}
                </div>

                <button
                  onClick={async () => {
                    try {
                      await signOut()
                    } catch (error) {
                      console.error('Error during logout:', error)
                      // Force redirect even if logout fails
                      window.location.href = '/auth/login'
                    }
                  }}
                  disabled={loading}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    loading
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {loading ? 'Cerrando...' : 'Cerrar Sesión'}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/login"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}