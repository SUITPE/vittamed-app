'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Icons } from '@/components/ui/Icons'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export default function ModernNavigation() {
  const { user, loading, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasActiveSession, setHasActiveSession] = useState(false)

  // Check for active session on component mount and when user changes
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        setHasActiveSession(response.ok)
      } catch (error) {
        setHasActiveSession(false)
      }
    }

    // Check if user is available from AuthProvider or check directly via API
    if (user) {
      setHasActiveSession(true)
    } else if (!loading) {
      checkActiveSession()
    }
  }, [user, loading])

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-xl animate-pulse" />
                  <div className="w-24 h-6 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-9 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error during logout:', error)
      window.location.href = '/auth/login'
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div
                className="w-8 h-8 bg-gradient-primary rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icons.heartHandshake className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                VittaMed
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {user && (
                <>
                  <NavLink href="/booking" icon="calendar">
                    Reservar Cita
                  </NavLink>

                  {(user.profile?.role === 'admin_tenant' || user.profile?.role === 'staff' || user.profile?.role === 'receptionist') && (
                    <>
                      <NavLink href={`/dashboard/${user.profile.tenant_id}`} icon="activity">
                        Dashboard
                      </NavLink>
                      <NavLink href="/admin/services" icon="stethoscope">
                        Servicios
                      </NavLink>
                      <NavLink href="/appointments" icon="clock3">
                        Citas
                      </NavLink>
                    </>
                  )}

                  {user.profile?.role === 'doctor' && (
                    <>
                      <NavLink href="/agenda" icon="calendarDays">
                        Mi Agenda
                      </NavLink>
                      <NavLink href="/appointments" icon="clock3">
                        Mis Citas
                      </NavLink>
                    </>
                  )}

                  {user.profile?.role === 'patient' && (
                    <NavLink href="/my-appointments" icon="userCheck">
                      Mis Citas
                    </NavLink>
                  )}

                  <NavLink href="/patients" icon="users">
                    Pacientes
                  </NavLink>
                </>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="hidden sm:flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {user.profile?.first_name} {user.profile?.last_name}
                    </div>
                    {user.profile?.role && (
                      <Badge
                        variant={
                          user.profile.role === 'admin_tenant' ? 'default' :
                          user.profile.role === 'doctor' ? 'success' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {user.profile.role === 'admin_tenant' && 'Administrador'}
                        {user.profile.role === 'doctor' && 'Doctor'}
                        {user.profile.role === 'patient' && 'Paciente'}
                      </Badge>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-gradient-medical rounded-full flex items-center justify-center">
                    <Icons.user className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Sign Out Button */}
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  className="text-gray-500 hover:text-red-600"
                >
                  <Icons.logOut className="w-4 h-4 mr-2" />
                  {loading ? 'Cerrando...' : 'Salir'}
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="button-press">
                    Registrarse
                  </Button>
                </Link>
                {/* Logout button - only show if there's an active session but no user in AuthProvider */}
                {hasActiveSession && !user && (
                  <Button
                    onClick={async () => {
                      try {
                        await fetch('/api/auth/clear-cookies', { method: 'POST' })
                        setHasActiveSession(false)
                        window.location.href = '/'
                      } catch (error) {
                        console.error('Error clearing cookies:', error)
                        window.location.href = '/'
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-sm text-gray-600 hover:text-red-600 border-gray-300"
                    title="Cerrar sesión activa"
                  >
                    <Icons.logOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <Icons.x className="w-5 h-5" />
              ) : (
                <Icons.menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="md:hidden border-t border-gray-200/60 bg-white/95 backdrop-blur-xl"
        >
          <div className="px-4 pt-2 pb-3 space-y-1">
            {user && (
              <>
                <MobileNavLink href="/booking" icon="calendar">
                  Reservar Cita
                </MobileNavLink>

                {(user.profile?.role === 'admin_tenant' || user.profile?.role === 'staff' || user.profile?.role === 'receptionist') && (
                  <>
                    <MobileNavLink href={`/dashboard/${user.profile.tenant_id}`} icon="activity">
                      Dashboard
                    </MobileNavLink>
                    <MobileNavLink href="/admin/services" icon="stethoscope">
                      Servicios
                    </MobileNavLink>
                    <MobileNavLink href="/appointments" icon="clock3">
                      Citas
                    </MobileNavLink>
                  </>
                )}

                {user.profile?.role === 'doctor' && (
                  <>
                    <MobileNavLink href="/agenda" icon="calendarDays">
                      Mi Agenda
                    </MobileNavLink>
                    <MobileNavLink href="/appointments" icon="clock3">
                      Mis Citas
                    </MobileNavLink>
                  </>
                )}

                {user.profile?.role === 'patient' && (
                  <MobileNavLink href="/my-appointments" icon="userCheck">
                    Mis Citas
                  </MobileNavLink>
                )}

                <MobileNavLink href="/patients" icon="users">
                  Pacientes
                </MobileNavLink>
              </>
            )}

            {/* Logout button - only show if there's an active session in mobile */}
            {hasActiveSession && !user && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/auth/clear-cookies', { method: 'POST' })
                      setHasActiveSession(false)
                      window.location.href = '/'
                    } catch (error) {
                      console.error('Error clearing cookies:', error)
                      window.location.href = '/'
                    }
                  }}
                  className="flex items-center space-x-3 w-full rounded-xl px-3 py-3 text-base font-medium transition-all duration-200 text-gray-600 hover:text-red-600 hover:bg-red-50"
                  title="Cerrar sesión activa"
                >
                  <Icons.logOut className="w-5 h-5 transition-colors" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  )
}

function NavLink({
  href,
  icon,
  children,
  className
}: {
  href: string
  icon: keyof typeof Icons
  children: React.ReactNode
  className?: string
}) {
  const Icon = Icons[icon]

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center space-x-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
        "text-gray-600 hover:text-primary-600 hover:bg-primary-50",
        "focus:outline-none focus:ring-2 focus:ring-primary-500/20",
        className
      )}
    >
      <Icon className="w-4 h-4 transition-colors" />
      <span>{children}</span>
    </Link>
  )
}

function MobileNavLink({
  href,
  icon,
  children
}: {
  href: string
  icon: keyof typeof Icons
  children: React.ReactNode
}) {
  const Icon = Icons[icon]

  return (
    <Link
      href={href}
      className="group flex items-center space-x-3 rounded-xl px-3 py-3 text-base font-medium transition-all duration-200 text-gray-600 hover:text-primary-600 hover:bg-primary-50"
    >
      <Icon className="w-5 h-5 transition-colors" />
      <span>{children}</span>
    </Link>
  )
}