// Feature Flags and Subscription Types

export type FeatureCategory = 'clinical' | 'business' | 'marketing' | 'integration'

export type FeatureKey =
  // Clinical Features
  | 'patient_management'
  | 'electronic_prescriptions'
  | 'medical_records'
  | 'lab_results'
  | 'imaging_storage'
  // Business Features
  | 'appointments'
  | 'inventory_management'
  | 'billing'
  | 'reports'
  | 'multi_location'
  // Marketing Features
  | 'email_marketing'
  | 'whatsapp_notifications'
  | 'online_booking'
  | 'loyalty_program'
  // Integration Features
  | 'api_access'
  | 'calendar_sync'
  | 'stripe_integration'

export type SubscriptionPlanKey = 'free' | 'basic' | 'professional' | 'enterprise'

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled' | 'paused'

export interface FeatureFlag {
  id: string
  feature_key: FeatureKey
  feature_name: string
  description: string | null
  category: FeatureCategory
  is_premium: boolean
  created_at: string
  updated_at: string
}

export interface TenantFeature {
  id: string
  tenant_id: string
  feature_key: FeatureKey
  is_enabled: boolean
  enabled_at: string | null
  disabled_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  id: string
  plan_key: SubscriptionPlanKey
  plan_name: string
  description: string | null
  price_monthly: number
  price_yearly: number
  max_users: number | null
  max_appointments_per_month: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PlanFeature {
  id: string
  plan_key: SubscriptionPlanKey
  feature_key: FeatureKey
  is_included: boolean
  created_at: string
}

export interface TenantWithSubscription {
  id: string
  name: string
  tenant_type: string
  subscription_plan_key: SubscriptionPlanKey
  subscription_starts_at: string | null
  subscription_ends_at: string | null
  subscription_status: SubscriptionStatus
}

// Helper types for UI
export interface FeatureWithStatus extends FeatureFlag {
  is_enabled: boolean
  is_available_in_plan: boolean
}

export interface PlanWithFeatures extends SubscriptionPlan {
  features: FeatureFlag[]
}

// Configuration for feature display
export const FEATURE_CONFIG: Record<FeatureKey, {
  icon: string
  color: string
  shortDescription: string
}> = {
  // Clinical
  patient_management: {
    icon: '📋',
    color: 'blue',
    shortDescription: 'Historia clínica y gestión de pacientes'
  },
  electronic_prescriptions: {
    icon: '💊',
    color: 'purple',
    shortDescription: 'Recetas médicas electrónicas'
  },
  medical_records: {
    icon: '📝',
    color: 'indigo',
    shortDescription: 'Historias clínicas digitales'
  },
  lab_results: {
    icon: '🔬',
    color: 'cyan',
    shortDescription: 'Resultados de laboratorio'
  },
  imaging_storage: {
    icon: '📷',
    color: 'teal',
    shortDescription: 'Almacenamiento de imágenes médicas'
  },
  // Business
  appointments: {
    icon: '📅',
    color: 'green',
    shortDescription: 'Sistema de agendamiento'
  },
  inventory_management: {
    icon: '📦',
    color: 'orange',
    shortDescription: 'Control de inventario'
  },
  billing: {
    icon: '💰',
    color: 'yellow',
    shortDescription: 'Facturación y pagos'
  },
  reports: {
    icon: '📊',
    color: 'pink',
    shortDescription: 'Reportes y estadísticas'
  },
  multi_location: {
    icon: '🏢',
    color: 'gray',
    shortDescription: 'Gestión multi-sucursal'
  },
  // Marketing
  email_marketing: {
    icon: '✉️',
    color: 'blue',
    shortDescription: 'Campañas de email'
  },
  whatsapp_notifications: {
    icon: '💬',
    color: 'green',
    shortDescription: 'Notificaciones por WhatsApp'
  },
  online_booking: {
    icon: '🌐',
    color: 'indigo',
    shortDescription: 'Reservas online'
  },
  loyalty_program: {
    icon: '⭐',
    color: 'yellow',
    shortDescription: 'Programa de fidelización'
  },
  // Integration
  api_access: {
    icon: '🔌',
    color: 'purple',
    shortDescription: 'Acceso a API'
  },
  calendar_sync: {
    icon: '🔄',
    color: 'blue',
    shortDescription: 'Sincronización de calendarios'
  },
  stripe_integration: {
    icon: '💳',
    color: 'indigo',
    shortDescription: 'Procesamiento de pagos Stripe'
  }
}

// Plan display configuration
export const PLAN_CONFIG: Record<SubscriptionPlanKey, {
  icon: string
  color: string
  highlight: boolean
  features_included: number
}> = {
  free: {
    icon: '🆓',
    color: 'gray',
    highlight: false,
    features_included: 2
  },
  basic: {
    icon: '⚡',
    color: 'blue',
    highlight: false,
    features_included: 7
  },
  professional: {
    icon: '💼',
    color: 'purple',
    highlight: true,
    features_included: 14
  },
  enterprise: {
    icon: '🏆',
    color: 'gold',
    highlight: false,
    features_included: 17
  }
}
