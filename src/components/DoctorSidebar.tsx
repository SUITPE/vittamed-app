'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icons } from '@/components/ui/Icons'
import { cn } from '@/lib/utils'

export default function DoctorSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Listen for mobile sidebar toggle event from header
  useEffect(() => {
    const handleToggle = () => {
      setIsMobileOpen(prev => !prev)
    }
    window.addEventListener('toggle-mobile-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle)
  }, [])

  const menuItems = [
    {
      name: 'Mi Agenda',
      href: '/agenda',
      icon: Icons.calendarDays,
      description: 'Horarios y disponibilidad'
    },
    {
      name: 'Mis Citas',
      href: '/appointments',
      icon: Icons.clock3,
      description: 'Gestión de citas'
    },
    {
      name: 'Pacientes',
      href: '/patients',
      icon: Icons.users,
      description: 'Base de pacientes'
    },
    {
      name: 'Reservar',
      href: '/booking',
      icon: Icons.calendar,
      description: 'Nueva cita'
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
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50',
          // Mobile: slide in from left when open, hide when closed
          'md:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          // Desktop: normal collapse behavior
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-500 rounded-lg flex items-center justify-center">
                <Icons.stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">VittaMed</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:block p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <Icons.chevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <Icons.chevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Icons.x className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="px-3 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-green-50 text-green-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-green-600'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-green-600' : 'text-gray-400 group-hover:text-green-600'
                  )}
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200">
          <button
            onClick={handleSignOut}
            className={cn(
              'w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group'
            )}
          >
            <Icons.logOut className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-red-600" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <div className="font-medium text-sm">Cerrar Sesión</div>
                <div className="text-xs text-gray-500">Salir del sistema</div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Spacer to push content - only on desktop */}
      <div className={cn(
        'hidden md:block transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )} />
    </>
  )
}

// Export function to toggle mobile menu (to be called from header)
export function useSidebarToggle() {
  return { setIsMobileOpen: () => {} }
}
