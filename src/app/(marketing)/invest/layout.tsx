import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inversión - Ronda Pre-Seed',
  description:
    'Invierte en VittaSami. Ronda Pre-Seed de $40K USD. Plataforma SaaS de salud con IA, modelo freemium y tracción validada. TAM $2.5B en LATAM.',
  keywords: [
    'inversión healthtech',
    'startup salud',
    'pre-seed round',
    'SaaS LATAM',
    'inversión LatAm',
    'healthtech peru',
    'software médico inversión',
    'venture capital salud',
  ],
  openGraph: {
    title: 'Invierte en VittaSami - Ronda Pre-Seed $40K',
    description:
      'Plataforma SaaS de gestión de salud con IA. 150+ profesionales activos, 2,500+ citas gestionadas. Modelo freemium validado.',
    url: 'https://vittasami.com/invest',
    type: 'website',
    images: [
      {
        url: '/og-invest.png',
        width: 1200,
        height: 630,
        alt: 'VittaSami - Oportunidad de inversión Pre-Seed',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Invierte en VittaSami - Ronda Pre-Seed $40K',
    description:
      'Plataforma SaaS de gestión de salud con IA. 150+ profesionales activos, 2,500+ citas gestionadas.',
    images: ['/og-invest.png'],
  },
}

export default function InvestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
