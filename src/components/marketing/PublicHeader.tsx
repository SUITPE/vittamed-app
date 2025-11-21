'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Características', href: '/features' },
  { name: 'Precios', href: '/pricing' },
  { name: 'Blog', href: '/blog' },
  { name: 'Ayuda', href: '/ayuda' },
]

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  // Detect scroll for backdrop blur effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm'
          : 'bg-white border-b border-gray-200'
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <Image
                src="/vittasami/vittasami_logo_alta_zoom.png"
                alt="VittaSami Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
                priority
              />
              <span className="text-xl font-bold bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] bg-clip-text text-transparent">
                VittaSami
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors relative group',
                  pathname === item.href
                    ? 'text-[#40C9C6]'
                    : 'text-gray-700 hover:text-[#40C9C6]'
                )}
              >
                {item.name}
                {/* Active indicator */}
                {pathname === item.href && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            <Link href="/auth/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-[#40C9C6] hover:bg-[#40C9C6]/10"
              >
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                size="sm"
                className="gradient-primary text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
              >
                Comenzar Gratis
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 hover:text-[#40C9C6] transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden bg-white border-t border-gray-200"
          >
            <div className="space-y-1 px-4 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'block px-3 py-2 rounded-md text-base font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-[#40C9C6]/10 text-[#40C9C6]'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[#40C9C6]'
                  )}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile CTA Buttons */}
              <div className="mt-4 space-y-2">
                <Link href="/auth/login" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-center"
                    size="default"
                  >
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/auth/register" className="block">
                  <Button
                    className="w-full justify-center gradient-primary text-white border-0"
                    size="default"
                  >
                    Comenzar Gratis
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
