'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Icons } from '@/components/ui/Icons'
import { DOMAINS } from '@/lib/config'

export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/vittasami/vittasami_logo_alta_zoom.png"
              alt="VittaSami Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] bg-clip-text text-transparent">
              VittaSami
            </span>
          </Link>

          {/* Right side - Auth buttons */}
          <div className="flex items-center space-x-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-gray-700 hover:text-[#40C9C6] transition-colors px-4 py-2"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/auth/register-business"
              className="text-sm font-medium text-white bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] hover:from-[#33a19e] hover:to-[#8aca85] transition-all duration-300 px-4 py-2 rounded-lg shadow-md hover:shadow-lg"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
