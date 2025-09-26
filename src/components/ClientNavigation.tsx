'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ClientNavigationProps {
  currentPath?: string
}

export default function ClientNavigation({ currentPath = '' }: ClientNavigationProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Check if user is client
  const isClient = user?.profile?.role === 'client'

  if (!isClient) {
    return null
  }

  const clientMenuItems = [
    {
      name: 'Mis Citas',
      href: '/client/appointments',
      icon: '📅',
      description: 'Ver mis citas programadas'
    },
    {
      name: 'Reservar Cita',
      href: '/booking',
      icon: '➕',
      description: 'Reservar nueva cita'
    },
    {
      name: 'Mis Pagos',
      href: '/client/payments',
      icon: '💳',
      description: 'Historial de pagos y facturas'
    },
    {
      name: 'Mi Perfil',
      href: '/client/profile',
      icon: '👤',
      description: 'Actualizar información personal'
    }
  ]

  const quickActions = [
    {
      name: 'Reservar',
      href: '/booking',
      icon: '🗓️',
      color: 'bg-teal-500 hover:bg-teal-600'
    }
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                🏥 VittaMed Client
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${action.color} transition-colors`}
                  title={action.name}
                >
                  <span className="mr-1">{action.icon}</span>
                  <span className="hidden lg:inline">{action.name}</span>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-sm rounded-full bg-white p-2 hover:bg-gray-50 border border-gray-300"
              >
                <div className="h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-medium">
                  {user?.profile?.first_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'C'}
                </div>
                <span className="text-gray-700 font-medium">
                  {user?.profile?.first_name} {user?.profile?.last_name}
                </span>
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {isMenuOpen && (
                <>
                  {/* Overlay */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsMenuOpen(false)}
                  />

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                        Cliente VittaMed
                      </div>

                      <div className="py-2">
                        <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Mi Cuenta
                        </div>
                        {clientMenuItems.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              currentPath === item.href ? 'bg-teal-50 text-teal-600 border-r-2 border-teal-600' : 'text-gray-700'
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="mr-3">{item.icon}</span>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-gray-500">{item.description}</div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <span className="mr-3">🚪</span>
                            Cerrar Sesión
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
            {clientMenuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  currentPath === item.href
                    ? 'bg-teal-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <span className="mr-3">{item.icon}</span>
                  <div>
                    <div>{item.name}</div>
                    <div className="text-sm opacity-75">{item.description}</div>
                  </div>
                </div>
              </Link>
            ))}

            {/* Mobile Quick Actions */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Acciones Rápidas
              </div>
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <span className="mr-3">{action.icon}</span>
                    {action.name} Cita
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile Sign Out */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                <div className="flex items-center">
                  <span className="mr-3">🚪</span>
                  Cerrar Sesión
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}