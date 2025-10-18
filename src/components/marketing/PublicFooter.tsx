'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin } from 'lucide-react'

const footerNavigation = {
  product: [
    { name: 'Características', href: '/features' },
    { name: 'Precios', href: '/pricing' },
    { name: 'Casos de Uso', href: '/features#use-cases' },
    { name: 'Integraciones', href: '/features#integrations' },
  ],
  resources: [
    { name: 'Blog', href: '/blog' },
    { name: 'Guías', href: '/recursos/guias' },
    { name: 'API Docs', href: '/docs/api' },
    { name: 'Centro de Ayuda', href: '/ayuda' },
  ],
  company: [
    { name: 'Sobre Nosotros', href: '/sobre-nosotros' },
    { name: 'Inversores', href: '/invest' },
    { name: 'Carreras', href: '/carreras' },
    { name: 'Contacto', href: '/contacto' },
  ],
  legal: [
    { name: 'Privacidad', href: '/privacidad' },
    { name: 'Términos', href: '/terminos' },
    { name: 'Cookies', href: '/cookies' },
    { name: 'Seguridad', href: '/seguridad' },
  ],
}

const socialLinks = [
  { name: 'Facebook', href: '#', icon: Facebook },
  { name: 'Twitter', href: '#', icon: Twitter },
  { name: 'Instagram', href: '#', icon: Instagram },
  { name: 'LinkedIn', href: '#', icon: Linkedin },
]

export default function PublicFooter() {
  return (
    <footer className="bg-[#003A47] text-white" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Logo y descripción */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center space-x-2 group">
              <Image
                src="/vittasami/vittasami_logo_alta_zoom.png"
                alt="VittaSami Logo"
                width={32}
                height={32}
                className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] bg-clip-text text-transparent">
                VittaSami
              </span>
            </Link>

            <p className="text-sm text-gray-300 max-w-md">
              Plataforma moderna de gestión para salud y bienestar. Agenda ilimitada gratis,
              IA, pagos integrados y mucho más.
            </p>

            {/* Redes sociales */}
            <div className="flex space-x-4">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 hover:text-[#40C9C6] transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>

            {/* Contacto */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Mail className="h-4 w-4 text-[#40C9C6]" />
                <a
                  href="mailto:contacto@vittasami.com"
                  className="hover:text-[#40C9C6] transition-colors"
                >
                  contacto@vittasami.com
                </a>
              </div>
              <div className="flex items-start space-x-2 text-sm text-gray-300">
                <MapPin className="h-4 w-4 text-[#40C9C6] mt-0.5 flex-shrink-0" />
                <span>Lima, Perú</span>
              </div>
            </div>
          </div>

          {/* Links de navegación */}
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              {/* Producto */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#A6E3A1]">
                  Producto
                </h3>
                <ul className="mt-4 space-y-3">
                  {footerNavigation.product.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recursos */}
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#A6E3A1]">
                  Recursos
                </h3>
                <ul className="mt-4 space-y-3">
                  {footerNavigation.resources.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-8">
              {/* Empresa */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#A6E3A1]">
                  Empresa
                </h3>
                <ul className="mt-4 space-y-3">
                  {footerNavigation.company.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#A6E3A1]">
                  Legal
                </h3>
                <ul className="mt-4 space-y-3">
                  {footerNavigation.legal.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} VittaSami. Todos los derechos reservados.
            </p>

            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Hecho con ❤️ en Perú</span>
              <span className="hidden sm:inline">•</span>
              <Link
                href="/invest"
                className="hidden sm:inline text-[#40C9C6] hover:text-[#A6E3A1] transition-colors font-medium"
              >
                Inversionistas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
