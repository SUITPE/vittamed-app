'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import ModernNavigation from '@/components/layout/ModernNavigation'

interface ClientProvidersProps {
  children: ReactNode
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <ModernNavigation />
      {children}
    </AuthProvider>
  )
}