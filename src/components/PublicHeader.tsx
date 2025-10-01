'use client'

import Link from 'next/link'
import { Icons } from '@/components/ui/Icons'

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
              <Icons.heartHandshake className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-600">
              VittaMed
            </span>
          </Link>

          {/* Right side - Auth buttons */}
          <div className="flex items-center space-x-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-4 py-2"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/auth/register-business"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-lg"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
