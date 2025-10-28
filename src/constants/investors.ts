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
    description?: string
  }[]
}

export const INVESTOR_BLOCKS: InvestorBlock[] = [
  {
    id: 'problem',
    title: 'El Problema',
    content:
      'El 80% de los centros de salud y bienestar en LATAM aún gestionan citas, pagos y pacientes de forma manual. Esto genera pérdida de tiempo, errores humanos, y falta de seguimiento clínico. Los profesionales pierden 2-3 horas diarias en tareas administrativas que deberían estar automatizadas.',
    icon: 'alertCircle',
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
      'VittaSami es una plataforma SaaS que digitaliza la gestión de salud con agenda gratuita, IA predictiva y pagos integrados. Diseñada para clínicas, centros y profesionales de bienestar con onboarding en menos de 5 minutos, integración con pasarelas locales (Culqi, Niubiz) y módulos escalables según el tamaño de cada práctica.',
    icon: 'lightbulb',
    stats: [
      { label: 'Plan Free', value: '$0/mes', description: 'Agenda ilimitada' },
      { label: 'Setup', value: '< 5 min', description: 'Sin curva de aprendizaje' },
      { label: 'Conversión a pago', value: '18%', description: 'Modelo freemium probado' },
    ],
  },
  {
    id: 'market',
    title: 'Oportunidad de Mercado',
    content:
      'Atacamos un mercado masivo con baja penetración de software. Enfoque inicial en Perú, Colombia y Chile, con expansión programada a México. Segmentos clave: medicina estética, fisioterapia, nutrición, psicología y profesionales independientes con alta rotación de pacientes.',
    icon: 'globe',
    stats: [
      { label: 'TAM', value: '$2.5B', description: 'Mercado total LATAM' },
      { label: 'SAM', value: '$100M', description: 'Perú, Colombia, Chile' },
      { label: 'SOM', value: '$1-2M', description: '1,000 clínicas pagantes' },
    ],
  },
  {
    id: 'traction',
    title: 'Tracción y Validación',
    content:
      '2 pilotos activos en clínicas reales con adopción orgánica. 150+ profesionales usando la agenda diariamente. 2,500+ citas gestionadas. Feedback positivo y primeros ingresos recurrentes que validan el producto-mercado fit.',
    icon: 'trendingUp',
    stats: [
      { label: 'Pilotos activos', value: '2', description: 'Clínicas reales' },
      { label: 'Profesionales', value: '150+', description: 'Uso diario activo' },
      { label: 'Citas gestionadas', value: '2,500+', description: 'Validación operativa' },
    ],
  },
  {
    id: 'business-model',
    title: 'Modelo de Negocio',
    content:
      'Estrategia freemium con 4 planes: Free (agenda ilimitada) → Care $39/mes (IA + gestión integral) → Pro $79/mes (equipos + pagos online) → Enterprise $149/mes (personalización total + multi-sede). LTV estimado de $1,200 con CAC de $180 (ratio 6.6x).',
    icon: 'dollarSign',
    stats: [
      { label: 'ARPU', value: '$65', description: 'Ingreso promedio mensual' },
      { label: 'LTV', value: '$1,200', description: 'Valor de vida del cliente' },
      { label: 'CAC', value: '$180', description: 'Costo de adquisición' },
      { label: 'LTV:CAC', value: '6.6x', description: 'Economía saludable' },
    ],
  },
  {
    id: 'competition',
    title: 'Ventaja Competitiva',
    content:
      'A diferencia de competidores como Clivi (México), Examedi (Chile) o Doctoralia (España), VittaSami ofrece: (1) Propiedad completa de datos del paciente, (2) Onboarding en menos de 5 minutos, (3) Freemium real con agenda ilimitada, (4) Integración regional con pagos locales, (5) IA predictiva aplicada a retención y revenue.',
    icon: 'award',
    stats: [
      { label: 'Onboarding', value: '< 5 min', description: 'vs 30-60 min competencia' },
      { label: 'Plan Free', value: 'Real', description: 'Agenda ilimitada genuina' },
      { label: 'Propiedad datos', value: '100%', description: 'Del profesional' },
      { label: 'IA predictiva', value: 'Incluida', description: 'Retención inteligente' },
    ],
  },
  {
    id: 'investment',
    title: 'Plan de Inversión',
    content:
      'Buscamos $40,000 USD (SAFE + revenue share) para 6 meses de runway enfocado en ejecución rápida y eficiente. Modelo de equipo flexible optimizado para validación y escalamiento del producto.',
    icon: 'target',
    stats: [
      { label: 'Inversión', value: '$40K', description: 'SAFE + revenue share' },
      { label: 'Runway', value: '6 meses', description: 'Ejecución ágil' },
      { label: 'Objetivo MRR', value: '$26K', description: 'A 6 meses' },
      { label: 'Clínicas pagantes', value: '400', description: 'Meta Q3 2026' },
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
    quarter: 'Q1 2026',
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
    quarter: 'Q2 2026',
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
    quarter: 'Q3 2026',
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
  isCollaborator?: boolean
}

export const TEAM: TeamMember[] = [
  {
    name: 'Álvaro Burga',
    role: 'Founder & Product Manager',
    bio: '+4 años de experiencia liderando productos SaaS y HealthTech para EE.UU. y LatAm (Blaze, Globant). Enfoque en growth, validación de producto y operaciones.',
    linkedin: 'https://www.linkedin.com/in/alvaro-burga-perez/',
    image: '/vittasami/team/alvaro-burga.png',
    isCollaborator: false,
  },
]

export const TEAM_COLLABORATORS = {
  title: 'Equipo técnico colaborador (freelance & partners)',
  description:
    'Red validada de programadores y diseñadores con experiencia en salud digital. Participación flexible bajo modalidad on-demand, optimizando costos y velocidad de ejecución. Foco actual: IA de dictado, gestión clínica y módulo predictivo de salud.',
  note: 'El modelo de equipo actual prioriza agilidad y ejecución, sin estructura fija, destinando los fondos a validación y escalamiento del producto.',
}

export interface UseOfFunds {
  category: string
  percentage: number
  amount: string
  description: string
}

export const USE_OF_FUNDS: UseOfFunds[] = [
  {
    category: 'Desarrollo tecnológico',
    percentage: 55,
    amount: '$22,000',
    description: 'Freelancers técnicos + integraciones de IA',
  },
  {
    category: 'Marketing y adquisición',
    percentage: 25,
    amount: '$10,000',
    description: 'Estrategia B2B, demos y pilotos',
  },
  {
    category: 'Operaciones y soporte',
    percentage: 20,
    amount: '$8,000',
    description: 'Hosting, herramientas, Founder full-time',
  },
]

export const USE_OF_FUNDS_NOTE =
  'Modelo optimizado para eficiencia en uso del capital y ejecución rápida, priorizando validación y tracción sobre estructura de equipo fijo.'

export interface FinancialProjection {
  period: string
  revenue: string
  costs: string
  ebitda: string
  clinics: string
}

export const FINANCIAL_PROJECTIONS: FinancialProjection[] = [
  {
    period: '6 meses',
    revenue: '$3K',
    costs: '$39K',
    ebitda: '-$36K',
    clinics: '5',
  },
  {
    period: '12 meses',
    revenue: '$20K',
    costs: '$45K',
    ebitda: '-$25K',
    clinics: '15',
  },
  {
    period: '24 meses',
    revenue: '$90K',
    costs: '$65K',
    ebitda: '+$25K',
    clinics: '50',
  },
  {
    period: '36 meses',
    revenue: '$300K',
    costs: '$120K',
    ebitda: '+$180K',
    clinics: '150',
  },
]

export interface ValuationFactor {
  factor: string
  value: string
  description: string
}

export const VALUATION_FACTORS: ValuationFactor[] = [
  {
    factor: 'Idea innovadora',
    value: '$0.5M',
    description: 'IA + ownership de datos',
  },
  {
    factor: 'MVP funcional',
    value: '$0.5M',
    description: 'Producto en producción',
  },
  {
    factor: 'Equipo fundador',
    value: '$0.75M',
    description: 'Experiencia demostrada',
  },
  {
    factor: 'Mercado validado',
    value: '$1M',
    description: 'TAM de $2.5B',
  },
  {
    factor: 'Tracción y roadmap',
    value: '$0.25M',
    description: '150+ usuarios activos',
  },
]

export const VALUATION_COMPARABLES = [
  { company: 'Clivi', country: 'México', valuation: '$3.5M' },
  { company: 'Examedi', country: 'Chile', valuation: '$4M' },
  { company: 'Tucuvi', country: 'España', valuation: '$5M' },
]

export interface ClientLogo {
  name: string
  logo: string
  testimonial?: string
}

export const PILOT_CLIENTS: ClientLogo[] = [
  {
    name: 'Estética Montero',
    logo: '/vittasami/clients/estetica-montero.jpg',
    testimonial: 'Piloto activo - Clínica de medicina estética',
  },
  {
    name: 'Deztoo Estetyca',
    logo: '', // TODO: Agregar logo real de Deztoo
    testimonial: 'Piloto activo - Centro de estética y bienestar',
  },
]

export interface ProductMockup {
  src: string
  alt: string
  title: string
  description: string
}

export const PRODUCT_MOCKUPS: ProductMockup[] = [
  {
    src: '', // Placeholder - agregar screenshot real
    alt: 'Dashboard de VittaSami',
    title: 'Dashboard Inteligente',
    description:
      'Visión 360° de tu práctica con métricas en tiempo real, recordatorios automáticos y proyecciones de ingresos.',
  },
  {
    src: '', // Placeholder - agregar screenshot real
    alt: 'Agenda de VittaSami',
    title: 'Agenda Visual',
    description:
      'Gestión de citas drag & drop, vista semanal/mensual, disponibilidad por profesional y recordatorios automáticos.',
  },
  {
    src: '', // Placeholder - agregar screenshot real
    alt: 'Gestión de pacientes',
    title: 'Pacientes Centralizados',
    description:
      'Historial completo, notas clínicas, archivos adjuntos y seguimiento del paciente en un solo lugar.',
  },
  {
    src: '', // Placeholder - agregar screenshot real
    alt: 'IA Predictiva',
    title: 'IA Predictiva',
    description:
      'Predicción de no-shows, sugerencias de horarios óptimos y análisis de patrones de comportamiento.',
  },
  {
    src: '', // Placeholder - agregar screenshot real
    alt: 'Pagos Online',
    title: 'Pagos Integrados',
    description:
      'Procesamiento de pagos con Culqi/Niubiz, facturación automática y conciliación bancaria.',
  },
  {
    src: '', // Placeholder - agregar screenshot real
    alt: 'Reportes y Analíticas',
    title: 'Reportes Avanzados',
    description:
      'Análisis de rendimiento, ingresos por servicio, tasa de retención y métricas de crecimiento.',
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
      'Con la inversión, proyectamos break-even en Q2 2026 (18 meses). Sin inversión, en Q4 2026 (24 meses) con crecimiento orgánico.',
  },
]
