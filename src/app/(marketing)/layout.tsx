import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'VittaSami - Gestión moderna para salud y bienestar',
    template: '%s | VittaSami',
  },
  description:
    'Plataforma SaaS para centros de salud y bienestar. Agenda ilimitada gratis, IA, pagos integrados. Desde $0/mes.',
  keywords: [
    'agenda médica',
    'software clínicas',
    'gestión pacientes',
    'reservas online',
    'IA salud',
    'software spa',
    'agenda nutricionista',
    'software consultorio',
  ],
  authors: [{ name: 'VittaSami' }],
  creator: 'VittaSami',
  publisher: 'VittaSami',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://vittasami.com',
    siteName: 'VittaSami',
    title: 'VittaSami - Gestión moderna para salud y bienestar',
    description:
      'Plataforma SaaS para centros de salud y bienestar. Agenda ilimitada gratis, IA, pagos integrados.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VittaSami - Gestión moderna para salud y bienestar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VittaSami - Gestión moderna para salud y bienestar',
    description:
      'Plataforma SaaS para centros de salud y bienestar. Agenda ilimitada gratis, IA, pagos integrados.',
    images: ['/og-image.png'],
    creator: '@vittasami',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* El PublicHeader y PublicFooter se agregarán aquí */}
      {children}
    </>
  )
}
