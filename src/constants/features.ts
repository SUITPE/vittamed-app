/**
 * Features y beneficios de VittaSami
 * Para uso en landing, features page y marketing materials
 */

import { LucideIcon } from 'lucide-react'

export interface Feature {
  id: string
  icon: string // Nombre del ícono de Lucide
  title: string
  description: string
  gradient: string
  benefits?: string[]
}

export const MAIN_FEATURES: Feature[] = [
  {
    id: 'agenda',
    icon: 'CalendarDays',
    title: 'Agenda y Reservas',
    description:
      'Organiza tus citas con una vista clara y moderna. Sin límites de uso, ideal para profesionales de salud, estética o terapias.',
    gradient: 'from-[#40C9C6] to-[#33a19e]',
    benefits: [
      'Vista de calendario diaria, semanal y mensual',
      'Reservas online 24/7 para tus clientes',
      'Recordatorios automáticos por email y SMS',
      'Sincronización con Google Calendar',
      'Gestión de disponibilidad por profesional',
    ],
  },
  {
    id: 'patients',
    icon: 'Users',
    title: 'Gestión de Pacientes o Clientes',
    description:
      'Guarda historial de atención, evolución, notas y resultados. Perfecto para nutricionistas, estéticas o consultorios.',
    gradient: 'from-[#A6E3A1] to-[#8aca85]',
    benefits: [
      'Base de datos completa de contactos',
      'Historial de citas y evolución',
      'Notas y recomendaciones por sesión',
      'Archivos adjuntos (imágenes, documentos)',
      'Seguimiento de tratamientos o programas',
    ],
  },
  {
    id: 'ai',
    icon: 'Sparkles',
    title: 'Asistente con IA',
    description:
      'Registra tus consultas por voz y deja que la IA te ayude a resumir síntomas o recomendaciones.',
    gradient: 'from-[#40C9C6] to-[#297976]',
    benefits: [
      'Transcripción automática de consultas',
      'Resúmenes inteligentes de síntomas',
      'Sugerencias basadas en historial',
      'Detección de patrones en evolución',
      'Análisis predictivo de salud',
    ],
  },
  {
    id: 'payments',
    icon: 'CreditCard',
    title: 'Pagos Integrados',
    description:
      'Recibe pagos en línea de manera segura con Stripe o Culqi.',
    gradient: 'from-[#A6E3A1] to-[#6eb269]',
    benefits: [
      'Checkout seguro con tarjetas',
      'Pagos recurrentes para suscripciones',
      'Facturación automática',
      'Reportes financieros detallados',
      'Integración con sistemas contables',
    ],
  },
  {
    id: 'dashboard',
    icon: 'BarChart3',
    title: 'Dashboard de Desempeño',
    description:
      'Visualiza tus métricas: citas, ingresos y evolución de clientes o pacientes.',
    gradient: 'from-[#003A47] to-[#40C9C6]',
    benefits: [
      'KPIs en tiempo real',
      'Gráficos de ingresos mensuales',
      'Análisis de ocupación de agenda',
      'Reportes de pacientes nuevos vs recurrentes',
      'Exportación de datos a Excel',
    ],
  },
  {
    id: 'team',
    icon: 'UsersRound',
    title: 'Multiusuario y Permisos',
    description:
      'Trabaja en equipo con otros profesionales o asistentes sin complicaciones.',
    gradient: 'from-[#297976] to-[#003A47]',
    benefits: [
      'Roles personalizados (admin, doctor, recepcionista)',
      'Permisos granulares por función',
      'Agenda separada por profesional',
      'Gestión de múltiples sedes',
      'Colaboración en tiempo real',
    ],
  },
]

// Casos de uso por tipo de negocio
export interface UseCase {
  type: string
  title: string
  description: string
  icon: string
  examples: string[]
}

export const USE_CASES: UseCase[] = [
  {
    type: 'medical',
    title: 'Consultorios Médicos',
    description:
      'Para médicos generales, especialistas y clínicas que buscan digitalizar su práctica.',
    icon: 'Stethoscope',
    examples: [
      'Medicina general',
      'Pediatría',
      'Ginecología',
      'Dermatología',
      'Psicología',
    ],
  },
  {
    type: 'wellness',
    title: 'Salud y Bienestar',
    description:
      'Centros de terapias, nutrición y bienestar integral.',
    icon: 'Heart',
    examples: [
      'Nutrición',
      'Fisioterapia',
      'Quiropráctica',
      'Acupuntura',
      'Terapia ocupacional',
    ],
  },
  {
    type: 'beauty',
    title: 'Estética y Belleza',
    description:
      'Spa, centros de estética y profesionales de belleza.',
    icon: 'Sparkles',
    examples: [
      'Spa y masajes',
      'Estética facial',
      'Tratamientos corporales',
      'Barbería',
      'Salones de belleza',
    ],
  },
  {
    type: 'dental',
    title: 'Odontología',
    description:
      'Clínicas dentales y consultorios odontológicos.',
    icon: 'FileText',
    examples: [
      'Odontología general',
      'Ortodoncia',
      'Endodoncia',
      'Periodoncia',
      'Cirugía maxilofacial',
    ],
  },
  {
    type: 'therapy',
    title: 'Terapias Alternativas',
    description:
      'Profesionales de medicina alternativa y terapias holísticas.',
    icon: 'Flower2',
    examples: [
      'Medicina natural',
      'Homeopatía',
      'Reiki',
      'Aromaterapia',
      'Yoga terapéutico',
    ],
  },
  {
    type: 'fitness',
    title: 'Fitness y Deporte',
    description:
      'Entrenadores personales, gimnasios y centros deportivos.',
    icon: 'Dumbbell',
    examples: [
      'Entrenamiento personal',
      'Crossfit',
      'Pilates',
      'Spinning',
      'Preparación física',
    ],
  },
]

// Testimonios (para social proof)
export interface Testimonial {
  name: string
  role: string
  business: string
  avatar: string
  quote: string
  rating: number
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Dr. Carlos Mendoza',
    role: 'Médico General',
    business: 'Consultorio San Rafael',
    avatar: '/testimonials/dr-mendoza.jpg',
    quote:
      'VittaSami transformó completamente mi consultorio. Antes perdía horas en llamadas para confirmar citas, ahora todo es automático. Mis pacientes aman poder reservar online.',
    rating: 5,
  },
  {
    name: 'Ana Lucía Torres',
    role: 'Nutricionista',
    business: 'Nutrición Integral',
    avatar: '/testimonials/ana-torres.jpg',
    quote:
      'El asistente de IA es increíble. Me ayuda a registrar las consultas por voz y genera resúmenes automáticos. Ahorro 30 minutos por paciente en papeleo.',
    rating: 5,
  },
  {
    name: 'María González',
    role: 'Propietaria',
    business: 'Spa Serenity',
    avatar: '/testimonials/maria-gonzalez.jpg',
    quote:
      'Tenemos 4 terapeutas y antes era un caos coordinar agendas. Con VittaSami cada una tiene su calendario y los clientes reservan fácilmente. Las ventas subieron 40%.',
    rating: 5,
  },
]

// Stats para mostrar tracción
export interface Stat {
  value: string
  label: string
  icon?: string
}

export const PLATFORM_STATS: Stat[] = [
  {
    value: '2,500+',
    label: 'Citas gestionadas',
    icon: 'Calendar',
  },
  {
    value: '150+',
    label: 'Profesionales activos',
    icon: 'Users',
  },
  {
    value: '98%',
    label: 'Satisfacción de usuarios',
    icon: 'Star',
  },
  {
    value: '24/7',
    label: 'Soporte disponible',
    icon: 'Clock',
  },
]
