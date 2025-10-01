'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/contexts/AuthContext'
import ModernNavigation from '@/components/layout/ModernNavigation'
import ErrorBoundary from '@/components/ErrorBoundary'

interface ClientProvidersProps {
  children: ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const pathname = usePathname()

  // Hide ModernNavigation on admin routes (they use AdminSidebar) and root (will redirect)
  const hideModernNav = pathname === '/' || pathname?.startsWith('/dashboard/') || pathname?.startsWith('/admin/') || pathname?.startsWith('/receptionist/')

  useEffect(() => {
    // Global error handler for unhandled promise rejections and runtime errors
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Filter out browser extension errors
      const error = event.reason
      if (
        error?.message?.includes('message channel closed') ||
        error?.message?.includes('listener indicated') ||
        error?.message?.includes('Extension context invalidated') ||
        error?.message?.includes('chrome-extension://') ||
        error?.message?.includes('moz-extension://')
      ) {
        console.warn('Browser extension promise rejection ignored:', error?.message || error)
        event.preventDefault() // Prevent the unhandled rejection error from showing
        return
      }

      console.error('Unhandled promise rejection:', error)
    }

    const handleError = (event: ErrorEvent) => {
      // Filter out browser extension errors
      if (
        event.message?.includes('message channel closed') ||
        event.message?.includes('listener indicated') ||
        event.message?.includes('Extension context invalidated') ||
        event.message?.includes('chrome-extension://') ||
        event.message?.includes('moz-extension://')
      ) {
        console.warn('Browser extension error ignored:', event.message)
        event.preventDefault() // Prevent the error from propagating
        return
      }

      console.error('Global error:', event.error || event.message)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        {!hideModernNav && <ModernNavigation />}
        {children}
      </AuthProvider>
    </ErrorBoundary>
  )
}