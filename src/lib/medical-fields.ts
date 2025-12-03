/**
 * Medical Fields Configuration by Specialty
 * VT-245: Historias clínicas adaptativas por tipo de negocio
 */

import { z } from 'zod'

// Supported tenant/specialty types
export type SpecialtyType =
  | 'general'
  | 'pediatrics'
  | 'dentistry'
  | 'dermatology'
  | 'aesthetics'
  | 'nutrition'
  | 'physiotherapy'
  | 'psychology'
  | 'veterinary'

// Field types for dynamic forms
export type DynamicFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'file'
  | 'range'
  | 'odontogram'

// Field configuration interface
export interface MedicalFieldConfig {
  id: string
  name: string
  label: string
  type: DynamicFieldType
  required: boolean
  placeholder?: string
  helpText?: string
  unit?: string
  min?: number
  max?: number
  step?: number
  options?: { value: string; label: string }[]
  defaultValue?: string | number | boolean
  validation?: z.ZodSchema
  category: 'vital_signs' | 'measurements' | 'history' | 'examination' | 'treatment' | 'custom'
  order: number
}

// Specialty configuration
export interface SpecialtyConfig {
  id: SpecialtyType
  name: string
  description: string
  icon: string
  color: string
  fields: MedicalFieldConfig[]
}

// Map tenant_type to specialty
export const TENANT_TYPE_TO_SPECIALTY: Record<string, SpecialtyType> = {
  clinic: 'general',
  consultorio: 'general',
  spa: 'aesthetics',
  dental: 'dentistry',
  pediatric: 'pediatrics',
  dermatology: 'dermatology',
  nutrition: 'nutrition',
  physiotherapy: 'physiotherapy',
  psychology: 'psychology',
  veterinary: 'veterinary'
}

// Common fields shared across all specialties
export const COMMON_FIELDS: MedicalFieldConfig[] = [
  {
    id: 'chief_complaint',
    name: 'chief_complaint',
    label: 'Motivo de Consulta',
    type: 'textarea',
    required: true,
    placeholder: 'Describe el motivo principal de la consulta...',
    category: 'history',
    order: 1
  },
  {
    id: 'current_medications',
    name: 'current_medications',
    label: 'Medicamentos Actuales',
    type: 'textarea',
    required: false,
    placeholder: 'Lista de medicamentos que el paciente toma actualmente...',
    category: 'history',
    order: 2
  }
]

// Specialty-specific field configurations
export const SPECIALTY_FIELDS: Record<SpecialtyType, MedicalFieldConfig[]> = {
  general: [
    {
      id: 'family_history',
      name: 'family_history',
      label: 'Antecedentes Familiares',
      type: 'textarea',
      required: false,
      placeholder: 'Enfermedades relevantes en la familia...',
      category: 'history',
      order: 10
    },
    {
      id: 'surgical_history',
      name: 'surgical_history',
      label: 'Antecedentes Quirúrgicos',
      type: 'textarea',
      required: false,
      placeholder: 'Cirugías previas...',
      category: 'history',
      order: 11
    },
    {
      id: 'smoking_status',
      name: 'smoking_status',
      label: 'Tabaquismo',
      type: 'select',
      required: false,
      options: [
        { value: 'never', label: 'Nunca' },
        { value: 'former', label: 'Exfumador' },
        { value: 'current', label: 'Fumador activo' }
      ],
      category: 'history',
      order: 12
    },
    {
      id: 'alcohol_use',
      name: 'alcohol_use',
      label: 'Consumo de Alcohol',
      type: 'select',
      required: false,
      options: [
        { value: 'none', label: 'No consume' },
        { value: 'occasional', label: 'Ocasional' },
        { value: 'moderate', label: 'Moderado' },
        { value: 'heavy', label: 'Frecuente' }
      ],
      category: 'history',
      order: 13
    }
  ],

  pediatrics: [
    {
      id: 'birth_weight',
      name: 'birth_weight',
      label: 'Peso al Nacer',
      type: 'number',
      required: false,
      unit: 'kg',
      min: 0.5,
      max: 6,
      step: 0.01,
      category: 'history',
      order: 10
    },
    {
      id: 'birth_height',
      name: 'birth_height',
      label: 'Talla al Nacer',
      type: 'number',
      required: false,
      unit: 'cm',
      min: 30,
      max: 60,
      step: 0.1,
      category: 'history',
      order: 11
    },
    {
      id: 'gestational_age',
      name: 'gestational_age',
      label: 'Edad Gestacional',
      type: 'number',
      required: false,
      unit: 'semanas',
      min: 24,
      max: 42,
      category: 'history',
      order: 12
    },
    {
      id: 'head_circumference',
      name: 'head_circumference',
      label: 'Perímetro Cefálico',
      type: 'number',
      required: false,
      unit: 'cm',
      min: 30,
      max: 60,
      step: 0.1,
      category: 'measurements',
      order: 20
    },
    {
      id: 'weight_percentile',
      name: 'weight_percentile',
      label: 'Percentil de Peso',
      type: 'number',
      required: false,
      unit: '%',
      min: 0,
      max: 100,
      category: 'measurements',
      order: 21
    },
    {
      id: 'height_percentile',
      name: 'height_percentile',
      label: 'Percentil de Talla',
      type: 'number',
      required: false,
      unit: '%',
      min: 0,
      max: 100,
      category: 'measurements',
      order: 22
    },
    {
      id: 'developmental_milestones',
      name: 'developmental_milestones',
      label: 'Hitos del Desarrollo',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'social_smile', label: 'Sonrisa social' },
        { value: 'head_control', label: 'Control cefálico' },
        { value: 'sitting', label: 'Sentarse' },
        { value: 'crawling', label: 'Gateo' },
        { value: 'walking', label: 'Caminar' },
        { value: 'first_words', label: 'Primeras palabras' },
        { value: 'sentences', label: 'Oraciones' }
      ],
      category: 'examination',
      order: 30
    },
    {
      id: 'feeding_type',
      name: 'feeding_type',
      label: 'Tipo de Alimentación',
      type: 'select',
      required: false,
      options: [
        { value: 'exclusive_breastfeeding', label: 'Lactancia materna exclusiva' },
        { value: 'mixed', label: 'Mixta' },
        { value: 'formula', label: 'Fórmula' },
        { value: 'complementary', label: 'Alimentación complementaria' }
      ],
      category: 'history',
      order: 14
    },
    {
      id: 'vaccination_status',
      name: 'vaccination_status',
      label: 'Estado de Vacunación',
      type: 'select',
      required: false,
      options: [
        { value: 'complete', label: 'Completo' },
        { value: 'incomplete', label: 'Incompleto' },
        { value: 'unknown', label: 'Desconocido' }
      ],
      category: 'history',
      order: 15
    }
  ],

  dentistry: [
    {
      id: 'last_dental_visit',
      name: 'last_dental_visit',
      label: 'Última Visita Dental',
      type: 'date',
      required: false,
      category: 'history',
      order: 10
    },
    {
      id: 'brushing_frequency',
      name: 'brushing_frequency',
      label: 'Frecuencia de Cepillado',
      type: 'select',
      required: false,
      options: [
        { value: 'rarely', label: 'Raramente' },
        { value: 'once_daily', label: '1 vez al día' },
        { value: 'twice_daily', label: '2 veces al día' },
        { value: 'after_meals', label: 'Después de cada comida' }
      ],
      category: 'history',
      order: 11
    },
    {
      id: 'flossing_habit',
      name: 'flossing_habit',
      label: 'Uso de Hilo Dental',
      type: 'select',
      required: false,
      options: [
        { value: 'never', label: 'Nunca' },
        { value: 'occasionally', label: 'Ocasionalmente' },
        { value: 'daily', label: 'Diariamente' }
      ],
      category: 'history',
      order: 12
    },
    {
      id: 'tooth_sensitivity',
      name: 'tooth_sensitivity',
      label: 'Sensibilidad Dental',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'cold', label: 'Al frío' },
        { value: 'hot', label: 'Al calor' },
        { value: 'sweet', label: 'A lo dulce' },
        { value: 'pressure', label: 'A la presión' },
        { value: 'none', label: 'Ninguna' }
      ],
      category: 'examination',
      order: 20
    },
    {
      id: 'gum_condition',
      name: 'gum_condition',
      label: 'Estado de Encías',
      type: 'select',
      required: false,
      options: [
        { value: 'healthy', label: 'Sanas' },
        { value: 'gingivitis', label: 'Gingivitis' },
        { value: 'periodontitis', label: 'Periodontitis' },
        { value: 'recession', label: 'Recesión' }
      ],
      category: 'examination',
      order: 21
    },
    {
      id: 'teeth_affected',
      name: 'teeth_affected',
      label: 'Piezas Dentales Afectadas',
      type: 'text',
      required: false,
      placeholder: 'Ej: 11, 21, 36...',
      helpText: 'Usar nomenclatura FDI',
      category: 'examination',
      order: 22
    },
    {
      id: 'dental_procedure',
      name: 'dental_procedure',
      label: 'Procedimiento Realizado',
      type: 'select',
      required: false,
      options: [
        { value: 'cleaning', label: 'Limpieza' },
        { value: 'filling', label: 'Obturación' },
        { value: 'extraction', label: 'Extracción' },
        { value: 'root_canal', label: 'Endodoncia' },
        { value: 'crown', label: 'Corona' },
        { value: 'implant', label: 'Implante' },
        { value: 'orthodontics', label: 'Ortodoncia' },
        { value: 'whitening', label: 'Blanqueamiento' }
      ],
      category: 'treatment',
      order: 30
    },
    {
      id: 'xray_taken',
      name: 'xray_taken',
      label: 'Radiografía',
      type: 'checkbox',
      required: false,
      category: 'examination',
      order: 23
    }
  ],

  dermatology: [
    {
      id: 'skin_type',
      name: 'skin_type',
      label: 'Tipo de Piel',
      type: 'select',
      required: false,
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'dry', label: 'Seca' },
        { value: 'oily', label: 'Grasa' },
        { value: 'combination', label: 'Mixta' },
        { value: 'sensitive', label: 'Sensible' }
      ],
      category: 'examination',
      order: 10
    },
    {
      id: 'fitzpatrick_type',
      name: 'fitzpatrick_type',
      label: 'Fototipo (Fitzpatrick)',
      type: 'select',
      required: false,
      options: [
        { value: 'I', label: 'I - Muy claro, siempre se quema' },
        { value: 'II', label: 'II - Claro, se quema fácilmente' },
        { value: 'III', label: 'III - Medio, a veces se quema' },
        { value: 'IV', label: 'IV - Oliva, rara vez se quema' },
        { value: 'V', label: 'V - Moreno, muy rara vez se quema' },
        { value: 'VI', label: 'VI - Oscuro, nunca se quema' }
      ],
      category: 'examination',
      order: 11
    },
    {
      id: 'sun_exposure',
      name: 'sun_exposure',
      label: 'Exposición Solar',
      type: 'select',
      required: false,
      options: [
        { value: 'minimal', label: 'Mínima' },
        { value: 'moderate', label: 'Moderada' },
        { value: 'frequent', label: 'Frecuente' },
        { value: 'occupational', label: 'Ocupacional' }
      ],
      category: 'history',
      order: 12
    },
    {
      id: 'sunscreen_use',
      name: 'sunscreen_use',
      label: 'Uso de Protector Solar',
      type: 'select',
      required: false,
      options: [
        { value: 'never', label: 'Nunca' },
        { value: 'occasionally', label: 'Ocasionalmente' },
        { value: 'daily', label: 'Diariamente' }
      ],
      category: 'history',
      order: 13
    },
    {
      id: 'lesion_location',
      name: 'lesion_location',
      label: 'Localización de Lesiones',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'face', label: 'Cara' },
        { value: 'scalp', label: 'Cuero cabelludo' },
        { value: 'neck', label: 'Cuello' },
        { value: 'chest', label: 'Tórax' },
        { value: 'back', label: 'Espalda' },
        { value: 'arms', label: 'Brazos' },
        { value: 'hands', label: 'Manos' },
        { value: 'legs', label: 'Piernas' },
        { value: 'feet', label: 'Pies' }
      ],
      category: 'examination',
      order: 20
    },
    {
      id: 'lesion_type',
      name: 'lesion_type',
      label: 'Tipo de Lesión',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'macule', label: 'Mácula' },
        { value: 'papule', label: 'Pápula' },
        { value: 'nodule', label: 'Nódulo' },
        { value: 'vesicle', label: 'Vesícula' },
        { value: 'pustule', label: 'Pústula' },
        { value: 'plaque', label: 'Placa' },
        { value: 'ulcer', label: 'Úlcera' }
      ],
      category: 'examination',
      order: 21
    },
    {
      id: 'lesion_evolution',
      name: 'lesion_evolution',
      label: 'Tiempo de Evolución',
      type: 'text',
      required: false,
      placeholder: 'Ej: 2 semanas, 3 meses...',
      category: 'history',
      order: 14
    }
  ],

  aesthetics: [
    {
      id: 'skin_concerns',
      name: 'skin_concerns',
      label: 'Preocupaciones Estéticas',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'wrinkles', label: 'Arrugas' },
        { value: 'fine_lines', label: 'Líneas finas' },
        { value: 'sagging', label: 'Flacidez' },
        { value: 'pigmentation', label: 'Manchas' },
        { value: 'acne_scars', label: 'Cicatrices de acné' },
        { value: 'pores', label: 'Poros dilatados' },
        { value: 'dark_circles', label: 'Ojeras' },
        { value: 'volume_loss', label: 'Pérdida de volumen' }
      ],
      category: 'history',
      order: 10
    },
    {
      id: 'previous_treatments',
      name: 'previous_treatments',
      label: 'Tratamientos Previos',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'botox', label: 'Botox' },
        { value: 'fillers', label: 'Rellenos' },
        { value: 'laser', label: 'Láser' },
        { value: 'peeling', label: 'Peeling' },
        { value: 'microneedling', label: 'Microagujas' },
        { value: 'mesotherapy', label: 'Mesoterapia' },
        { value: 'radiofrequency', label: 'Radiofrecuencia' },
        { value: 'none', label: 'Ninguno' }
      ],
      category: 'history',
      order: 11
    },
    {
      id: 'skincare_routine',
      name: 'skincare_routine',
      label: 'Rutina de Cuidado Actual',
      type: 'textarea',
      required: false,
      placeholder: 'Describe los productos y pasos que usa actualmente...',
      category: 'history',
      order: 12
    },
    {
      id: 'treatment_area',
      name: 'treatment_area',
      label: 'Zona a Tratar',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'forehead', label: 'Frente' },
        { value: 'glabella', label: 'Entrecejo' },
        { value: 'crow_feet', label: 'Patas de gallo' },
        { value: 'nasolabial', label: 'Surcos nasogenianos' },
        { value: 'lips', label: 'Labios' },
        { value: 'cheeks', label: 'Mejillas' },
        { value: 'jawline', label: 'Línea mandibular' },
        { value: 'neck', label: 'Cuello' },
        { value: 'hands', label: 'Manos' }
      ],
      category: 'treatment',
      order: 20
    },
    {
      id: 'procedure_performed',
      name: 'procedure_performed',
      label: 'Procedimiento Realizado',
      type: 'select',
      required: false,
      options: [
        { value: 'consultation', label: 'Consulta/Evaluación' },
        { value: 'botox', label: 'Toxina Botulínica' },
        { value: 'hyaluronic_acid', label: 'Ácido Hialurónico' },
        { value: 'biorevitalization', label: 'Biorevitalización' },
        { value: 'chemical_peel', label: 'Peeling Químico' },
        { value: 'laser', label: 'Tratamiento Láser' },
        { value: 'radiofrequency', label: 'Radiofrecuencia' },
        { value: 'microneedling', label: 'Microagujas' }
      ],
      category: 'treatment',
      order: 21
    },
    {
      id: 'units_used',
      name: 'units_used',
      label: 'Unidades/Cantidad Usada',
      type: 'text',
      required: false,
      placeholder: 'Ej: 20 unidades, 1ml...',
      category: 'treatment',
      order: 22
    },
    {
      id: 'before_photo',
      name: 'before_photo',
      label: 'Foto Antes',
      type: 'file',
      required: false,
      category: 'examination',
      order: 30
    },
    {
      id: 'after_photo',
      name: 'after_photo',
      label: 'Foto Después',
      type: 'file',
      required: false,
      category: 'treatment',
      order: 31
    }
  ],

  nutrition: [
    {
      id: 'current_weight',
      name: 'current_weight',
      label: 'Peso Actual',
      type: 'number',
      required: true,
      unit: 'kg',
      min: 20,
      max: 300,
      step: 0.1,
      category: 'measurements',
      order: 10
    },
    {
      id: 'goal_weight',
      name: 'goal_weight',
      label: 'Peso Meta',
      type: 'number',
      required: false,
      unit: 'kg',
      min: 20,
      max: 300,
      step: 0.1,
      category: 'measurements',
      order: 11
    },
    {
      id: 'waist_circumference',
      name: 'waist_circumference',
      label: 'Circunferencia de Cintura',
      type: 'number',
      required: false,
      unit: 'cm',
      min: 40,
      max: 200,
      step: 0.1,
      category: 'measurements',
      order: 12
    },
    {
      id: 'hip_circumference',
      name: 'hip_circumference',
      label: 'Circunferencia de Cadera',
      type: 'number',
      required: false,
      unit: 'cm',
      min: 40,
      max: 200,
      step: 0.1,
      category: 'measurements',
      order: 13
    },
    {
      id: 'body_fat_percentage',
      name: 'body_fat_percentage',
      label: 'Porcentaje de Grasa Corporal',
      type: 'number',
      required: false,
      unit: '%',
      min: 3,
      max: 60,
      step: 0.1,
      category: 'measurements',
      order: 14
    },
    {
      id: 'muscle_mass',
      name: 'muscle_mass',
      label: 'Masa Muscular',
      type: 'number',
      required: false,
      unit: 'kg',
      min: 10,
      max: 100,
      step: 0.1,
      category: 'measurements',
      order: 15
    },
    {
      id: 'eating_habits',
      name: 'eating_habits',
      label: 'Hábitos Alimenticios',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'regular_meals', label: 'Comidas regulares' },
        { value: 'skips_breakfast', label: 'Salta desayuno' },
        { value: 'late_dinner', label: 'Cena tarde' },
        { value: 'snacking', label: 'Picoteo frecuente' },
        { value: 'emotional_eating', label: 'Comedor emocional' },
        { value: 'fast_eater', label: 'Come rápido' }
      ],
      category: 'history',
      order: 20
    },
    {
      id: 'diet_type',
      name: 'diet_type',
      label: 'Tipo de Dieta',
      type: 'select',
      required: false,
      options: [
        { value: 'omnivore', label: 'Omnívora' },
        { value: 'vegetarian', label: 'Vegetariana' },
        { value: 'vegan', label: 'Vegana' },
        { value: 'pescatarian', label: 'Pescetariana' },
        { value: 'keto', label: 'Cetogénica' },
        { value: 'mediterranean', label: 'Mediterránea' },
        { value: 'other', label: 'Otra' }
      ],
      category: 'history',
      order: 21
    },
    {
      id: 'food_intolerances',
      name: 'food_intolerances',
      label: 'Intolerancias Alimentarias',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'lactose', label: 'Lactosa' },
        { value: 'gluten', label: 'Gluten' },
        { value: 'fructose', label: 'Fructosa' },
        { value: 'none', label: 'Ninguna' }
      ],
      category: 'history',
      order: 22
    },
    {
      id: 'physical_activity',
      name: 'physical_activity',
      label: 'Actividad Física',
      type: 'select',
      required: false,
      options: [
        { value: 'sedentary', label: 'Sedentario' },
        { value: 'light', label: 'Ligera (1-2 días/semana)' },
        { value: 'moderate', label: 'Moderada (3-4 días/semana)' },
        { value: 'active', label: 'Activa (5+ días/semana)' },
        { value: 'athlete', label: 'Atleta' }
      ],
      category: 'history',
      order: 23
    },
    {
      id: 'water_intake',
      name: 'water_intake',
      label: 'Consumo de Agua',
      type: 'select',
      required: false,
      options: [
        { value: 'less_1l', label: 'Menos de 1 litro' },
        { value: '1_2l', label: '1-2 litros' },
        { value: '2_3l', label: '2-3 litros' },
        { value: 'more_3l', label: 'Más de 3 litros' }
      ],
      category: 'history',
      order: 24
    },
    {
      id: 'meal_plan',
      name: 'meal_plan',
      label: 'Plan Alimenticio',
      type: 'textarea',
      required: false,
      placeholder: 'Describe el plan alimenticio recomendado...',
      category: 'treatment',
      order: 30
    }
  ],

  physiotherapy: [
    {
      id: 'affected_area',
      name: 'affected_area',
      label: 'Zona Afectada',
      type: 'multiselect',
      required: true,
      options: [
        { value: 'neck', label: 'Cuello' },
        { value: 'shoulder', label: 'Hombro' },
        { value: 'back', label: 'Espalda' },
        { value: 'lumbar', label: 'Zona lumbar' },
        { value: 'hip', label: 'Cadera' },
        { value: 'knee', label: 'Rodilla' },
        { value: 'ankle', label: 'Tobillo' },
        { value: 'wrist', label: 'Muñeca' },
        { value: 'elbow', label: 'Codo' }
      ],
      category: 'examination',
      order: 10
    },
    {
      id: 'pain_level',
      name: 'pain_level',
      label: 'Nivel de Dolor (0-10)',
      type: 'range',
      required: false,
      min: 0,
      max: 10,
      step: 1,
      category: 'examination',
      order: 11
    },
    {
      id: 'pain_type',
      name: 'pain_type',
      label: 'Tipo de Dolor',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'sharp', label: 'Agudo' },
        { value: 'dull', label: 'Sordo' },
        { value: 'burning', label: 'Quemante' },
        { value: 'throbbing', label: 'Pulsátil' },
        { value: 'radiating', label: 'Irradiado' }
      ],
      category: 'examination',
      order: 12
    },
    {
      id: 'mobility_range',
      name: 'mobility_range',
      label: 'Rango de Movilidad',
      type: 'select',
      required: false,
      options: [
        { value: 'full', label: 'Completo' },
        { value: 'slightly_limited', label: 'Levemente limitado' },
        { value: 'moderately_limited', label: 'Moderadamente limitado' },
        { value: 'severely_limited', label: 'Severamente limitado' }
      ],
      category: 'examination',
      order: 13
    },
    {
      id: 'treatment_techniques',
      name: 'treatment_techniques',
      label: 'Técnicas Aplicadas',
      type: 'multiselect',
      required: false,
      options: [
        { value: 'manual_therapy', label: 'Terapia manual' },
        { value: 'electrotherapy', label: 'Electroterapia' },
        { value: 'ultrasound', label: 'Ultrasonido' },
        { value: 'laser', label: 'Láser' },
        { value: 'exercises', label: 'Ejercicios' },
        { value: 'stretching', label: 'Estiramientos' },
        { value: 'massage', label: 'Masaje' },
        { value: 'dry_needling', label: 'Punción seca' }
      ],
      category: 'treatment',
      order: 20
    },
    {
      id: 'exercise_plan',
      name: 'exercise_plan',
      label: 'Plan de Ejercicios',
      type: 'textarea',
      required: false,
      placeholder: 'Describe los ejercicios recomendados para casa...',
      category: 'treatment',
      order: 21
    },
    {
      id: 'sessions_recommended',
      name: 'sessions_recommended',
      label: 'Sesiones Recomendadas',
      type: 'number',
      required: false,
      min: 1,
      max: 50,
      category: 'treatment',
      order: 22
    }
  ],

  psychology: [
    {
      id: 'presenting_issue',
      name: 'presenting_issue',
      label: 'Motivo de Consulta Principal',
      type: 'textarea',
      required: true,
      placeholder: 'Describe el motivo principal de consulta...',
      category: 'history',
      order: 10
    },
    {
      id: 'symptom_duration',
      name: 'symptom_duration',
      label: 'Duración de Síntomas',
      type: 'text',
      required: false,
      placeholder: 'Ej: 3 meses, desde la infancia...',
      category: 'history',
      order: 11
    },
    {
      id: 'mood_state',
      name: 'mood_state',
      label: 'Estado de Ánimo Actual',
      type: 'select',
      required: false,
      options: [
        { value: 'stable', label: 'Estable' },
        { value: 'anxious', label: 'Ansioso' },
        { value: 'depressed', label: 'Deprimido' },
        { value: 'irritable', label: 'Irritable' },
        { value: 'euphoric', label: 'Eufórico' },
        { value: 'mixed', label: 'Mixto' }
      ],
      category: 'examination',
      order: 20
    },
    {
      id: 'sleep_quality',
      name: 'sleep_quality',
      label: 'Calidad del Sueño',
      type: 'select',
      required: false,
      options: [
        { value: 'good', label: 'Buena' },
        { value: 'insomnia', label: 'Insomnio' },
        { value: 'hypersomnia', label: 'Hipersomnia' },
        { value: 'interrupted', label: 'Sueño interrumpido' },
        { value: 'nightmares', label: 'Pesadillas frecuentes' }
      ],
      category: 'examination',
      order: 21
    },
    {
      id: 'appetite_changes',
      name: 'appetite_changes',
      label: 'Cambios en Apetito',
      type: 'select',
      required: false,
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'increased', label: 'Aumentado' },
        { value: 'decreased', label: 'Disminuido' },
        { value: 'variable', label: 'Variable' }
      ],
      category: 'examination',
      order: 22
    },
    {
      id: 'therapy_approach',
      name: 'therapy_approach',
      label: 'Enfoque Terapéutico',
      type: 'select',
      required: false,
      options: [
        { value: 'cbt', label: 'Terapia Cognitivo-Conductual' },
        { value: 'psychodynamic', label: 'Psicodinámica' },
        { value: 'humanistic', label: 'Humanista' },
        { value: 'systemic', label: 'Sistémica' },
        { value: 'gestalt', label: 'Gestalt' },
        { value: 'integrative', label: 'Integrativa' }
      ],
      category: 'treatment',
      order: 30
    },
    {
      id: 'session_notes',
      name: 'session_notes',
      label: 'Notas de Sesión',
      type: 'textarea',
      required: false,
      placeholder: 'Observaciones y temas abordados en la sesión...',
      category: 'treatment',
      order: 31
    },
    {
      id: 'homework_assignment',
      name: 'homework_assignment',
      label: 'Tarea para Casa',
      type: 'textarea',
      required: false,
      placeholder: 'Tareas o ejercicios asignados al paciente...',
      category: 'treatment',
      order: 32
    },
    {
      id: 'suicide_risk',
      name: 'suicide_risk',
      label: 'Evaluación de Riesgo',
      type: 'select',
      required: false,
      options: [
        { value: 'none', label: 'Sin riesgo' },
        { value: 'low', label: 'Riesgo bajo' },
        { value: 'moderate', label: 'Riesgo moderado' },
        { value: 'high', label: 'Riesgo alto' }
      ],
      category: 'examination',
      order: 23
    }
  ],

  veterinary: [
    {
      id: 'species',
      name: 'species',
      label: 'Especie',
      type: 'select',
      required: true,
      options: [
        { value: 'dog', label: 'Perro' },
        { value: 'cat', label: 'Gato' },
        { value: 'bird', label: 'Ave' },
        { value: 'rabbit', label: 'Conejo' },
        { value: 'hamster', label: 'Hámster' },
        { value: 'guinea_pig', label: 'Cobayo' },
        { value: 'reptile', label: 'Reptil' },
        { value: 'other', label: 'Otro' }
      ],
      category: 'history',
      order: 10
    },
    {
      id: 'breed',
      name: 'breed',
      label: 'Raza',
      type: 'text',
      required: false,
      placeholder: 'Ej: Labrador, Siamés...',
      category: 'history',
      order: 11
    },
    {
      id: 'age_years',
      name: 'age_years',
      label: 'Edad',
      type: 'text',
      required: false,
      placeholder: 'Ej: 3 años, 6 meses...',
      category: 'history',
      order: 12
    },
    {
      id: 'sex',
      name: 'sex',
      label: 'Sexo',
      type: 'select',
      required: false,
      options: [
        { value: 'male', label: 'Macho' },
        { value: 'female', label: 'Hembra' }
      ],
      category: 'history',
      order: 13
    },
    {
      id: 'neutered',
      name: 'neutered',
      label: 'Esterilizado/Castrado',
      type: 'checkbox',
      required: false,
      category: 'history',
      order: 14
    },
    {
      id: 'animal_weight',
      name: 'animal_weight',
      label: 'Peso',
      type: 'number',
      required: false,
      unit: 'kg',
      min: 0.1,
      max: 200,
      step: 0.1,
      category: 'measurements',
      order: 20
    },
    {
      id: 'vaccination_status',
      name: 'vaccination_status',
      label: 'Estado de Vacunación',
      type: 'select',
      required: false,
      options: [
        { value: 'complete', label: 'Completo' },
        { value: 'incomplete', label: 'Incompleto' },
        { value: 'unknown', label: 'Desconocido' }
      ],
      category: 'history',
      order: 15
    },
    {
      id: 'deworming_date',
      name: 'deworming_date',
      label: 'Última Desparasitación',
      type: 'date',
      required: false,
      category: 'history',
      order: 16
    },
    {
      id: 'diet_type',
      name: 'diet_type',
      label: 'Tipo de Alimentación',
      type: 'select',
      required: false,
      options: [
        { value: 'commercial_dry', label: 'Concentrado seco' },
        { value: 'commercial_wet', label: 'Alimento húmedo' },
        { value: 'homemade', label: 'Casera' },
        { value: 'barf', label: 'BARF/Raw' },
        { value: 'mixed', label: 'Mixta' }
      ],
      category: 'history',
      order: 17
    }
  ]
}

// Get all fields for a specialty (common + specialty-specific)
export function getFieldsForSpecialty(specialty: SpecialtyType): MedicalFieldConfig[] {
  const specialtyFields = SPECIALTY_FIELDS[specialty] || []
  return [...COMMON_FIELDS, ...specialtyFields].sort((a, b) => a.order - b.order)
}

// Get specialty from tenant type
export function getSpecialtyFromTenantType(tenantType: string): SpecialtyType {
  return TENANT_TYPE_TO_SPECIALTY[tenantType.toLowerCase()] || 'general'
}

// Specialty display configuration
export const SPECIALTY_CONFIG: Record<SpecialtyType, { name: string; icon: string; color: string }> = {
  general: { name: 'Medicina General', icon: '🏥', color: 'blue' },
  pediatrics: { name: 'Pediatría', icon: '👶', color: 'pink' },
  dentistry: { name: 'Odontología', icon: '🦷', color: 'cyan' },
  dermatology: { name: 'Dermatología', icon: '🔬', color: 'purple' },
  aesthetics: { name: 'Estética', icon: '✨', color: 'rose' },
  nutrition: { name: 'Nutrición', icon: '🥗', color: 'green' },
  physiotherapy: { name: 'Fisioterapia', icon: '💪', color: 'orange' },
  psychology: { name: 'Psicología', icon: '🧠', color: 'indigo' },
  veterinary: { name: 'Veterinaria', icon: '🐾', color: 'amber' }
}

// Field categories for grouping in UI
export const FIELD_CATEGORIES = {
  vital_signs: { name: 'Signos Vitales', icon: '❤️', order: 1 },
  measurements: { name: 'Mediciones', icon: '📏', order: 2 },
  history: { name: 'Antecedentes', icon: '📋', order: 3 },
  examination: { name: 'Examen', icon: '🔍', order: 4 },
  treatment: { name: 'Tratamiento', icon: '💊', order: 5 },
  custom: { name: 'Campos Personalizados', icon: '⚙️', order: 6 }
}
