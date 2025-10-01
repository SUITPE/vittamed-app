'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AdminNavigationProps {
  currentPath?: string
  tenantId?: string
}

export default function AdminNavigation({ currentPath = '', tenantId }: AdminNavigationProps) {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const currentTenantId = tenantId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'

  const adminMenuItems = [
    {
      name: 'Dashboard',
      href: `/dashboard/${currentTenantId}`,
      icon: '📊',
      description: 'Resumen general del negocio'
    },
    {
      name: 'Servicios',
      href: `/admin/services`,
      icon: '🏥',
      description: 'Configurar servicios médicos'
    },
    {
      name: 'Gestión de Usuarios',
      href: '/admin/manage-users',
      icon: '👥',
      description: 'Administrar miembros del equipo'
    },
    {
      name: 'Pacientes',
      href: '/patients',
      icon: '🧑‍⚕️',
      description: 'Base de datos de pacientes'
    },
    {
      name: 'Citas',
      href: '/appointments',
      icon: '📋',
      description: 'Gestión de citas médicas'
    }
  ]

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    }
    window.location.href = '/auth/login'
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                🏥 VittaMed Admin
              </h1>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-sm rounded-full bg-white p-2 hover:bg-gray-50 border border-gray-300"
              >
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  A
                </div>
                <span className="text-gray-700 font-medium">Admin</span>
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-2">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                      Administrador
                    </div>

                    <div className="py-2">
                      <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Gestión Administrativa
                      </div>
                      {adminMenuItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`block px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            currentPath === item.href ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'
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
              )}
            </div>
          </div>

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

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
            {adminMenuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  currentPath === item.href
                    ? 'bg-blue-500 text-white'
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