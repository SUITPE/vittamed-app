// Business type definitions for VittaMed platform

export type BusinessType =
  // Medical specialties
  | 'medical_clinic'
  | 'dental_clinic'
  | 'pediatric_clinic'
  | 'physiotherapy_clinic'
  | 'psychology_clinic'
  | 'aesthetic_clinic'

  // Wellness & beauty
  | 'wellness_spa'
  | 'beauty_salon'
  | 'massage_center'

  // Specialized centers
  | 'rehabilitation_center'
  | 'diagnostic_center'
  | 'veterinary_clinic'

  // Legacy types (backwards compatibility)
  | 'clinic'
  | 'spa'
  | 'consultorio';

export type BusinessCategory = 'medical' | 'wellness' | 'beauty' | 'specialty' | 'veterinary';

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  'medical',
  'wellness',
  'beauty',
  'specialty',
  'veterinary'
];

export interface BusinessTypeConfig {
  label: string;
  description: string;
  category: BusinessCategory;
  icon: string;
  settings: BusinessSettings;
}

export interface BusinessSettings {
  requires_insurance: boolean;
  default_appointment_duration: number; // in minutes
  requires_medical_history: boolean;
  requires_parent_consent?: boolean;
  appointment_types: string[];
  color_theme: string;
}

export const BUSINESS_TYPE_CONFIGS: Record<BusinessType, BusinessTypeConfig> = {
  // Medical specialties
  medical_clinic: {
    label: 'Clínica Médica General',
    description: 'Consultorios médicos generales y especialidades médicas',
    category: 'medical',
    icon: '🏥',
    settings: {
      requires_insurance: true,
      default_appointment_duration: 30,
      requires_medical_history: true,
      appointment_types: ['consultation', 'follow_up', 'emergency'],
      color_theme: 'medical_blue'
    }
  },

  dental_clinic: {
    label: 'Clínica Dental',
    description: 'Servicios de odontología general y especializada',
    category: 'medical',
    icon: '🦷',
    settings: {
      requires_insurance: true,
      default_appointment_duration: 60,
      requires_medical_history: true,
      appointment_types: ['cleaning', 'checkup', 'procedure', 'emergency'],
      color_theme: 'dental_teal'
    }
  },

  pediatric_clinic: {
    label: 'Clínica Pediátrica',
    description: 'Atención médica especializada para niños y adolescentes',
    category: 'medical',
    icon: '👶',
    settings: {
      requires_insurance: true,
      default_appointment_duration: 45,
      requires_medical_history: true,
      requires_parent_consent: true,
      appointment_types: ['checkup', 'vaccination', 'sick_visit'],
      color_theme: 'pediatric_green'
    }
  },

  physiotherapy_clinic: {
    label: 'Centro de Fisioterapia',
    description: 'Rehabilitación física y terapia de movimiento',
    category: 'medical',
    icon: '🏃‍♂️',
    settings: {
      requires_insurance: false,
      default_appointment_duration: 60,
      requires_medical_history: true,
      appointment_types: ['assessment', 'treatment', 'maintenance'],
      color_theme: 'physio_orange'
    }
  },

  psychology_clinic: {
    label: 'Consulta Psicológica',
    description: 'Servicios de salud mental y terapia psicológica',
    category: 'medical',
    icon: '🧠',
    settings: {
      requires_insurance: false,
      default_appointment_duration: 60,
      requires_medical_history: false,
      appointment_types: ['therapy', 'assessment', 'group_session'],
      color_theme: 'psychology_purple'
    }
  },

  aesthetic_clinic: {
    label: 'Clínica Estética',
    description: 'Tratamientos estéticos y medicina cosmética',
    category: 'beauty',
    icon: '✨',
    settings: {
      requires_insurance: false,
      default_appointment_duration: 90,
      requires_medical_history: false,
      appointment_types: ['consultation', 'treatment', 'maintenance'],
      color_theme: 'aesthetic_pink'
    }
  },

  // Wellness & beauty
  wellness_spa: {
    label: 'Spa de Bienestar',
    description: 'Centro de relajación y tratamientos de bienestar',
    category: 'wellness',
    icon: '🧘‍♀️',
    settings: {
      requires_insurance: false,
      default_appointment_duration: 90,
      requires_medical_history: false,
      appointment_types: ['massage', 'facial', 'body_treatment', 'package'],
      color_theme: 'spa_zen'
    }
  },

  beauty_salon: {
    label: 'Salón de Belleza',
    description: 'Servicios de peluquería y belleza integral',
    category: 'beauty',
    icon: '💇‍♀️',
    settings: {
      requires_insurance: false,
      default_appointment_duration: 120,
      requires_medical_history: false,
      appointment_types: ['haircut', 'coloring', 'styling', 'treatment'],
      color_theme: 'beauty_gold'
    }
  },

  massage_center: {
    label: 'Centro de Masajes',
    description: 'Masajes terapéuticos y de relajación',
    category: 'wellness',
    icon: '👐',
    settings: {
      requires_insurance: false,
      default_appointment_duration: 60,
      requires_medical_history: false,
      appointment_types: ['relaxation', 'therapeutic', 'sports_massage'],
      color_theme: 'massage_earth'
    }
  },

  // Specialized centers
  rehabilitation_center: {
    label: 'Centro de Rehabilitación',
    description: 'Rehabilitación integral y terapia ocupacional',
    category: 'specialty',
    icon: '🦽',
    settings: {
      requires_insurance: true,
      default_appointment_duration: 60,
      requires_medical_history: true,
      appointment_types: ['assessment', 'therapy', 'group_therapy'],
      color_theme: 'rehab_blue'
    }
  },

  diagnostic_center: {
    label: 'Centro de Diagnóstico',
    description: 'Estudios médicos, laboratorio e imágenes',
    category: 'specialty',
    icon: '🔬',
    settings: {
      requires_insurance: true,
      default_appointment_duration: 30,
      requires_medical_history: true,
      appointment_types: ['imaging', 'lab_work', 'screening'],
      color_theme: 'diagnostic_gray'
    }
  },

  veterinary_clinic: {
    label: 'Clínica Veterinaria',
    description: 'Atención médica para mascotas y animales',
    category: 'veterinary',
    icon: '🐕',
    settings: {
      requires_insurance: false,
      default_appointment_duration: 30,
      requires_medical_history: true,
      appointment_types: ['checkup', 'vaccination', 'surgery', 'emergency'],
      color_theme: 'vet_green'
    }
  },

  // Legacy types (backwards compatibility)
  clinic: {
    label: 'Clínica General',
    description: 'Clínica médica general (tipo legacy)',
    category: 'medical',
    icon: '🏥',
    settings: {
      requires_insurance: true,
      default_appointment_duration: 30,
      requires_medical_history: true,
      appointment_types: ['consultation', 'follow_up'],
      color_theme: 'default_blue'
    }
  },

  spa: {
    label: 'Spa',
    description: 'Centro de spa y bienestar (tipo legacy)',
    category: 'wellness',
    icon: '🧘‍♀️',
    settings: {
      requires_insurance: false,
      default_appointment_duration: 90,
      requires_medical_history: false,
      appointment_types: ['massage', 'facial', 'treatment'],
      color_theme: 'spa_zen'
    }
  },

  consultorio: {
    label: 'Consultorio Privado',
    description: 'Consultorio médico privado (tipo legacy)',
    category: 'medical',
    icon: '👨‍⚕️',
    settings: {
      requires_insurance: false,
      default_appointment_duration: 45,
      requires_medical_history: true,
      appointment_types: ['consultation', 'follow_up'],
      color_theme: 'consultorio_gray'
    }
  }
};

// Helper functions
export function getBusinessTypeConfig(type: BusinessType): BusinessTypeConfig {
  return BUSINESS_TYPE_CONFIGS[type];
}

export function getBusinessTypesByCategory(category: BusinessTypeConfig['category']): BusinessType[] {
  return Object.entries(BUSINESS_TYPE_CONFIGS)
    .filter(([_, config]) => config.category === category)
    .map(([type, _]) => type as BusinessType);
}

export function isLegacyType(type: BusinessType): boolean {
  return ['clinic', 'spa', 'consultorio'].includes(type);
}

// Color theme definitions
export const COLOR_THEMES = {
  medical_blue: { primary: '#2563eb', secondary: '#eff6ff', accent: '#1d4ed8' },
  dental_teal: { primary: '#0d9488', secondary: '#f0fdfa', accent: '#0f766e' },
  pediatric_green: { primary: '#22c55e', secondary: '#f0fdf4', accent: '#16a34a' },
  physio_orange: { primary: '#ea580c', secondary: '#fff7ed', accent: '#dc2626' },
  psychology_purple: { primary: '#9333ea', secondary: '#faf5ff', accent: '#7c3aed' },
  aesthetic_pink: { primary: '#ec4899', secondary: '#fdf2f8', accent: '#db2777' },
  spa_zen: { primary: '#84cc16', secondary: '#f7fee7', accent: '#65a30d' },
  beauty_gold: { primary: '#d97706', secondary: '#fffbeb', accent: '#b45309' },
  massage_earth: { primary: '#a3a3a3', secondary: '#f9fafb', accent: '#737373' },
  rehab_blue: { primary: '#3b82f6', secondary: '#eff6ff', accent: '#2563eb' },
  diagnostic_gray: { primary: '#6b7280', secondary: '#f9fafb', accent: '#4b5563' },
  vet_green: { primary: '#059669', secondary: '#ecfdf5', accent: '#047857' },
  default_blue: { primary: '#3b82f6', secondary: '#eff6ff', accent: '#2563eb' },
  consultorio_gray: { primary: '#64748b', secondary: '#f8fafc', accent: '#475569' }
};