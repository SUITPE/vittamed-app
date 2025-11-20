/**
 * Configuración de planes y precios de VittaSami
 * Single source of truth para todos los planes freemium
 */

export interface PricingPlan {
  id: string
  name: string
  price: {
    monthly: number
    annual: number
  }
  tagline: string
  description: string
  idealFor: string
  features: string[]
  cta: string
  ctaLink: string
  popular?: boolean
  enterprise?: boolean
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: {
      monthly: 0,
      annual: 0,
    },
    tagline: 'Agenda & Reservas',
    description: 'Gratis para siempre',
    idealFor: 'Profesionales o centros que necesitan organizar sus citas',
    features: [
      'Agenda ilimitada y reservas online',
      'Recordatorios automáticos por email',
      'Calendario diario, semanal y mensual',
      'Sin límites de uso',
      'Panel de citas del día',
      'Gestión básica de horarios',
    ],
    cta: 'Comenzar Gratis',
    ctaLink: '/auth/register',
  },
  {
    id: 'care',
    name: 'Care',
    price: {
      monthly: 39,
      annual: 33, // 39 * 12 * 0.85 / 12 = 33.15
    },
    tagline: 'Gestión + IA',
    description: 'Para profesionales individuales',
    idealFor: 'Profesionales individuales o pequeños centros',
    features: [
      'Todo lo del plan Free',
      'Gestión de pacientes o clientes',
      'Historial y seguimiento completo',
      'Dictado de voz para notas',
      'Asistente IA para síntomas y resúmenes',
      'Evolución de pacientes con gráficos',
      'Soporte prioritario',
      'Exportación de datos',
    ],
    cta: 'Empezar con Care',
    ctaLink: '/auth/register?plan=care',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: {
      monthly: 79,
      annual: 67, // 79 * 12 * 0.85 / 12 = 67.15
    },
    tagline: 'Equipos',
    description: 'Para clínicas con varios profesionales',
    idealFor: 'Clínicas o centros con varios profesionales',
    features: [
      'Todo lo del plan Care',
      'Hasta 5 profesionales incluidos',
      'Sin límite de clientes',
      'Roles y permisos avanzados',
      'Pagos integrados con Stripe',
      'Dashboard con métricas y reportes',
      'Análisis de desempeño',
      'API de integraciones',
      'Soporte dedicado 24/7',
    ],
    cta: 'Empezar con Pro',
    ctaLink: '/auth/register?plan=pro',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: {
      monthly: 149,
      annual: 127, // 149 * 12 * 0.85 / 12 = 126.65
    },
    tagline: 'Escalabilidad Total',
    description: 'Para redes y franquicias',
    idealFor: 'Redes de centros o franquicias',
    features: [
      'Todo lo del plan Pro',
      'Profesionales y sedes ilimitadas',
      'Branding personalizado (logo, dominio, colores)',
      'API completa de integraciones',
      'Integración con laboratorios',
      'Integración con sistemas contables',
      'WhatsApp Business API',
      'IA avanzada y analítica predictiva',
      'Onboarding personalizado',
      'Soporte dedicado VIP',
      'SLA garantizado 99.9%',
    ],
    cta: 'Contactar Ventas',
    ctaLink: '/contacto?plan=enterprise',
    enterprise: true,
  },
]

// Descuento por plan anual
export const ANNUAL_DISCOUNT = 0.15 // 15%

// Comparación de features por plan
export interface FeatureComparison {
  category: string
  features: {
    name: string
    free: boolean | string
    care: boolean | string
    pro: boolean | string
    enterprise: boolean | string
  }[]
}

export const FEATURE_COMPARISON: FeatureComparison[] = [
  {
    category: 'Gestión de Agenda',
    features: [
      {
        name: 'Agenda ilimitada',
        free: true,
        care: true,
        pro: true,
        enterprise: true,
      },
      {
        name: 'Reservas online',
        free: true,
        care: true,
        pro: true,
        enterprise: true,
      },
      {
        name: 'Recordatorios automáticos',
        free: 'Email',
        care: 'Email + SMS',
        pro: 'Email + SMS + WhatsApp',
        enterprise: 'Email + SMS + WhatsApp',
      },
      {
        name: 'Calendario múltiple',
        free: false,
        care: false,
        pro: true,
        enterprise: true,
      },
    ],
  },
  {
    category: 'Gestión de Pacientes/Clientes',
    features: [
      {
        name: 'Base de datos de contactos',
        free: 'Básica',
        care: true,
        pro: true,
        enterprise: true,
      },
      {
        name: 'Historial y evolución',
        free: false,
        care: true,
        pro: true,
        enterprise: true,
      },
      {
        name: 'Dictado por voz',
        free: false,
        care: true,
        pro: true,
        enterprise: true,
      },
      {
        name: 'Asistente IA',
        free: false,
        care: 'Básico',
        pro: 'Avanzado',
        enterprise: 'Predictivo',
      },
    ],
  },
  {
    category: 'Equipo y Permisos',
    features: [
      {
        name: 'Usuarios',
        free: '1',
        care: '1',
        pro: '5',
        enterprise: 'Ilimitados',
      },
      {
        name: 'Roles y permisos',
        free: false,
        care: false,
        pro: true,
        enterprise: true,
      },
      {
        name: 'Múltiples sedes',
        free: false,
        care: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
  {
    category: 'Pagos y Facturación',
    features: [
      {
        name: 'Pagos integrados',
        free: false,
        care: false,
        pro: true,
        enterprise: true,
      },
      {
        name: 'Reportes financieros',
        free: false,
        care: false,
        pro: true,
        enterprise: true,
      },
      {
        name: 'Integración contable',
        free: false,
        care: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
  {
    category: 'Soporte',
    features: [
      {
        name: 'Soporte por email',
        free: '48h',
        care: '24h',
        pro: '12h',
        enterprise: '1h',
      },
      {
        name: 'Soporte prioritario',
        free: false,
        care: true,
        pro: true,
        enterprise: true,
      },
      {
        name: 'Gerente de cuenta dedicado',
        free: false,
        care: false,
        pro: false,
        enterprise: true,
      },
    ],
  },
]

// FAQs de pricing
export interface PricingFAQ {
  question: string
  answer: string
}

export const PRICING_FAQS: PricingFAQ[] = [
  {
    question: '¿Realmente el plan Free es gratis para siempre?',
    answer:
      'Sí, el plan Free incluye agenda y reservas ilimitadas sin ningún costo. No pedimos tarjeta de crédito y puedes usarlo indefinidamente. Es perfecto para profesionales que solo necesitan organizar sus citas.',
  },
  {
    question: '¿Puedo cambiar de plan en cualquier momento?',
    answer:
      'Por supuesto. Puedes actualizar o bajar de plan cuando quieras. Al actualizar, solo pagas la diferencia prorrateada. Al bajar de plan, el cambio se aplica al inicio del siguiente ciclo de facturación.',
  },
  {
    question: '¿Qué forma de pago aceptan?',
    answer:
      'Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express) a través de Stripe. También ofrecemos facturación anual con 15% de descuento.',
  },
  {
    question: '¿Qué pasa si necesito más usuarios en el plan Pro?',
    answer:
      'El plan Pro incluye hasta 5 profesionales. Si necesitas más, puedes agregar usuarios adicionales por $15/mes cada uno, o migrar al plan Enterprise que incluye usuarios ilimitados.',
  },
  {
    question: '¿Ofrecen período de prueba?',
    answer:
      'Todos los planes pagos (Care, Pro, Enterprise) incluyen 14 días de prueba gratis. No necesitas tarjeta de crédito para probar. Además, siempre puedes empezar con el plan Free para familiarizarte con la plataforma.',
  },
  {
    question: '¿Mis datos están seguros?',
    answer:
      'Absolutamente. Cumplimos con los más altos estándares de seguridad. Todos los datos están encriptados en tránsito y en reposo. Realizamos backups diarios y contamos con certificación de seguridad. Tu información nunca es compartida con terceros.',
  },
  {
    question: '¿Qué incluye el plan Enterprise?',
    answer:
      'El plan Enterprise está diseñado para organizaciones grandes. Incluye todo lo de Pro más: usuarios y sedes ilimitados, branding personalizado, API completa, integraciones custom, soporte VIP y SLA garantizado. Contacta a ventas para una demo personalizada.',
  },
  {
    question: '¿Puedo cancelar en cualquier momento?',
    answer:
      'Sí, no hay contratos de permanencia. Puedes cancelar tu suscripción cuando quieras desde tu panel de configuración. Al cancelar, mantienes acceso hasta el final del período pagado y luego pasas automáticamente al plan Free.',
  },
]

// Types para Feature Gating
export type PlanKey = 'free' | 'care' | 'pro' | 'enterprise'

export type FeatureKey =
  | 'unlimited_agenda'
  | 'online_booking'
  | 'email_reminders'
  | 'sms_reminders'
  | 'whatsapp_reminders'
  | 'multi_calendar'
  | 'patient_management'
  | 'medical_records'
  | 'voice_dictation'
  | 'ai_assistant'
  | 'ai_suggestions'
  | 'ai_predictive'
  | 'max_professionals'
  | 'max_patients'
  | 'max_appointments_per_month'
  | 'roles_permissions'
  | 'multi_locations'
  | 'integrated_payments'
  | 'financial_reports'
  | 'accounting_integration'
  | 'priority_support'
  | 'dedicated_manager'
  | 'custom_branding'
  | 'api_access'

// Mapa de features por plan para el sistema de Feature Gating
export const PLAN_FEATURES: Record<PlanKey, Record<FeatureKey, boolean | number | null>> = {
  free: {
    unlimited_agenda: true,
    online_booking: true,
    email_reminders: true,
    sms_reminders: false,
    whatsapp_reminders: false,
    multi_calendar: false,
    patient_management: false,
    medical_records: false,
    voice_dictation: false,
    ai_assistant: false,
    ai_suggestions: false,
    ai_predictive: false,
    max_professionals: 1,
    max_patients: 100,
    max_appointments_per_month: null, // ilimitado
    roles_permissions: false,
    multi_locations: false,
    integrated_payments: false,
    financial_reports: false,
    accounting_integration: false,
    priority_support: false,
    dedicated_manager: false,
    custom_branding: false,
    api_access: false,
  },
  care: {
    unlimited_agenda: true,
    online_booking: true,
    email_reminders: true,
    sms_reminders: true,
    whatsapp_reminders: false,
    multi_calendar: false,
    patient_management: true,
    medical_records: true,
    voice_dictation: true,
    ai_assistant: true,
    ai_suggestions: true,
    ai_predictive: false,
    max_professionals: 1,
    max_patients: null, // ilimitado
    max_appointments_per_month: null,
    roles_permissions: false,
    multi_locations: false,
    integrated_payments: false,
    financial_reports: false,
    accounting_integration: false,
    priority_support: true,
    dedicated_manager: false,
    custom_branding: false,
    api_access: false,
  },
  pro: {
    unlimited_agenda: true,
    online_booking: true,
    email_reminders: true,
    sms_reminders: true,
    whatsapp_reminders: true,
    multi_calendar: true,
    patient_management: true,
    medical_records: true,
    voice_dictation: true,
    ai_assistant: true,
    ai_suggestions: true,
    ai_predictive: false,
    max_professionals: 5,
    max_patients: null,
    max_appointments_per_month: null,
    roles_permissions: true,
    multi_locations: false,
    integrated_payments: true,
    financial_reports: true,
    accounting_integration: false,
    priority_support: true,
    dedicated_manager: false,
    custom_branding: false,
    api_access: true,
  },
  enterprise: {
    unlimited_agenda: true,
    online_booking: true,
    email_reminders: true,
    sms_reminders: true,
    whatsapp_reminders: true,
    multi_calendar: true,
    patient_management: true,
    medical_records: true,
    voice_dictation: true,
    ai_assistant: true,
    ai_suggestions: true,
    ai_predictive: true,
    max_professionals: null, // ilimitado
    max_patients: null,
    max_appointments_per_month: null,
    roles_permissions: true,
    multi_locations: true,
    integrated_payments: true,
    financial_reports: true,
    accounting_integration: true,
    priority_support: true,
    dedicated_manager: true,
    custom_branding: true,
    api_access: true,
  },
}
