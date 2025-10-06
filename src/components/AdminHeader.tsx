'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Icons } from '@/components/ui/Icons'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function AdminHeader() {
  const { user } = useAuth()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.profile-dropdown') && !target.closest('.notifications-dropdown')) {
        setIsProfileOpen(false)
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    }
    window.location.href = '/auth/login'
  }

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin_tenant':
        return 'Administrador'
      case 'staff':
        return 'Staff'
      case 'receptionist':
        return 'Recepcionista'
      case 'doctor':
        return 'Doctor'
      case 'patient':
        return 'Paciente'
      default:
        return role || 'Usuario'
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || 'U'
  }

  const toggleMobileSidebar = () => {
    // Dispatch custom event to toggle sidebar
    window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 right-0 left-0 md:left-64 z-30">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Left side - Mobile menu button + breadcrumbs */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={toggleMobileSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Icons.menu className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {/* Page title will go here */}
          </h2>
        </div>

        {/* Right side - Notifications & User */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative notifications-dropdown">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen)
                setIsProfileOpen(false)
              }}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icons.bellRing className="w-5 h-5 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No hay notificaciones nuevas
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="text-sm text-gray-900">{notification.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{notification.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search */}
          <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Icons.search className="w-5 h-5 text-gray-600" />
          </button>

          {/* User Profile */}
          <div className="relative profile-dropdown">
            <button
              onClick={() => {
                setIsProfileOpen(!isProfileOpen)
                setIsNotificationsOpen(false)
              }}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.profile?.first_name} {user?.profile?.last_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getRoleLabel(user?.profile?.role)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-white font-medium">
                  {getInitials(user?.profile?.first_name ?? undefined, user?.profile?.last_name ?? undefined)}
                </div>
              </div>
              <Icons.chevronDown className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                isProfileOpen && 'rotate-180'
              )} />
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="font-medium text-gray-900">
                    {user?.profile?.first_name} {user?.profile?.last_name}
                  </div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {getRoleLabel(user?.profile?.role)}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Icons.user className="w-4 h-4 mr-3 text-gray-400" />
                    Mi perfil
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Icons.settings className="w-4 h-4 mr-3 text-gray-400" />
                    Configuración
                  </Link>
                  <button
                    onClick={() => {
                      // Toggle help modal or redirect to help page
                      setIsProfileOpen(false)
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Icons.messageSquare className="w-4 h-4 mr-3 text-gray-400" />
                    Ayuda y soporte
                  </button>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Icons.logOut className="w-4 h-4 mr-3" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
