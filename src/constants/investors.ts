/**
 * Datos para la página de inversores
 * Información sobre oportunidad, tracción, modelo de negocio
 */

export interface InvestorBlock {
  id: string
  title: string
  content: string
  icon?: string
  stats?: {
    label: string
    value: string
  }[]
}

export const INVESTOR_BLOCKS: InvestorBlock[] = [
  {
    id: 'problem',
    title: 'El Problema',
    content:
      'El 80% de los centros de salud y bienestar en LATAM aún gestionan citas y pacientes de forma manual. Agendas en papel, llamadas de confirmación, falta de seguimiento y pérdida de información crítica son el día a día de miles de profesionales.',
    icon: 'AlertCircle',
    stats: [
      { label: 'Centros sin software', value: '80%' },
      { label: 'Tiempo perdido/día', value: '2-3 hrs' },
      { label: 'Mercado LATAM', value: '$2.5B' },
    ],
  },
  {
    id: 'solution',
    title: 'Nuestra Solución',
    content:
      'Un SaaS freemium con agenda gratuita ilimitada como puerta de entrada, y módulos escalables de gestión, IA y pagos. Diseñado específicamente para el mercado latino con precios accesibles y onboarding simple.',
    icon: 'Lightbulb',
    stats: [
      { label: 'Plan Free', value: '$0/mes' },
      { label: 'Setup', value: '< 5 min' },
      { label: 'Conversión a pago', value: '18%' },
    ],
  },
  {
    id: 'traction',
    title: 'Tracción Inicial',
    content:
      '2 pilotos activos con adopción orgánica de profesionales en diferentes especialidades. Validación de producto con usuarios reales, feedback positivo y primeros ingresos recurrentes.',
    icon: 'TrendingUp',
    stats: [
      { label: 'Pilotos activos', value: '2' },
      { label: 'Profesionales', value: '150+' },
      { label: 'Citas gestionadas', value: '2,500+' },
    ],
  },
  {
    id: 'business-model',
    title: 'Modelo de Negocio',
    content:
      'Estrategia freemium con 4 planes: Free (agenda ilimitada) → Care $39/mes (IA + gestión) → Pro $79/mes (equipos + pagos) → Enterprise $149/mes (personalización total). LTV estimado: $1,200 por cliente.',
    icon: 'DollarSign',
    stats: [
      { label: 'ARPU', value: '$65' },
      { label: 'LTV', value: '$1,200' },
      { label: 'CAC', value: '$180' },
    ],
  },
  {
    id: 'investment',
    title: 'Plan de Inversión',
    content:
      'Buscamos $40,000 USD (SAFE + revenue share) para 6 meses de runway. Enfoque en adquisición de usuarios, desarrollo de features premium y expansión a 3 países adicionales.',
    icon: 'Target',
    stats: [
      { label: 'Inversión', value: '$40K' },
      { label: 'Runway', value: '6 meses' },
      { label: 'Objetivo usuarios', value: '1,000' },
    ],
  },
  {
    id: 'use-of-funds',
    title: 'Uso de Fondos',
    content:
      'Marketing digital y growth (40%), desarrollo de producto (30%), operaciones y soporte (20%), legal y administrativo (10%).',
    icon: 'PieChart',
    stats: [
      { label: 'Marketing', value: '40%' },
      { label: 'Producto', value: '30%' },
      { label: 'Ops', value: '20%' },
      { label: 'Admin', value: '10%' },
    ],
  },
]

export interface Milestone {
  quarter: string
  goals: string[]
  metrics: {
    users: string
    mrr: string
  }
}

export const MILESTONES: Milestone[] = [
  {
    quarter: 'Q1 2025',
    goals: [
      'Lanzamiento oficial en Perú',
      '500 usuarios registrados',
      'Primeros 50 clientes pagos',
      'Integración con Culqi (pagos)',
    ],
    metrics: {
      users: '500',
      mrr: '$3,250',
    },
  },
  {
    quarter: 'Q2 2025',
    goals: [
      'Expansión a Colombia y Chile',
      '1,000 usuarios registrados',
      '150 clientes pagos',
      'Lanzamiento de app móvil',
    ],
    metrics: {
      users: '1,000',
      mrr: '$9,750',
    },
  },
  {
    quarter: 'Q3 2025',
    goals: [
      'Expansión a México',
      '2,500 usuarios registrados',
      '400 clientes pagos',
      'Series A fundraising',
    ],
    metrics: {
      users: '2,500',
      mrr: '$26,000',
    },
  },
]

export interface TeamMember {
  name: string
  role: string
  bio: string
  linkedin?: string
  image?: string
}

export const TEAM: TeamMember[] = [
  {
    name: 'Álvaro Bustamante',
    role: 'CEO & Founder',
    bio: 'Experiencia en desarrollo de productos SaaS y gestión de equipos técnicos.',
    linkedin: 'https://linkedin.com/in/alvaro-bustamante',
    image: '/team/alvaro.jpg',
  },
]

export const INVESTOR_FAQ = [
  {
    question: '¿Por qué LATAM y no otros mercados?',
    answer:
      'LATAM tiene una penetración de software médico <20% vs >60% en USA/Europa, lo que representa una oportunidad masiva. Además, conocemos el mercado, hablamos el idioma y entendemos las necesidades locales.',
  },
  {
    question: '¿Cómo se diferencian de la competencia?',
    answer:
      'Nuestra ventaja es el plan Free genuinamente útil (agenda ilimitada) que genera tracción orgánica, precios accesibles para LATAM, y enfoque en salud + bienestar (no solo médico). Competidores cobran desde día 1 o tienen UX compleja.',
  },
  {
    question: '¿Cuál es la estrategia de adquisición?',
    answer:
      'Marketing de contenido (SEO + blog), partnerships con asociaciones profesionales, programa de referidos, y prueba social. El plan Free reduce la fricción de entrada dramáticamente.',
  },
  {
    question: '¿Qué pasa si no levantan inversión?',
    answer:
      'Tenemos runway bootstrapped para 3 meses más. Si no levantamos, pivotamos a crecimiento más lento y orgánico, priorizando la rentabilidad sobre el crecimiento acelerado.',
  },
  {
    question: '¿Cuándo esperan ser rentables?',
    answer:
      'Con la inversión, proyectamos break-even en Q4 2025 (18 meses). Sin inversión, en Q2 2026 (24 meses) con crecimiento orgánico.',
  },
]
