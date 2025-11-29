/**
 * ICD10 Types
 *
 * Tipos TypeScript para códigos CIE-10 (Clasificación Internacional de Enfermedades)
 *
 * TASK: VT-230
 * Epic: Historias Clínicas Inteligentes
 */

/**
 * Código CIE-10 completo
 */
export interface ICD10Code {
  id: string;
  code: string;
  description: string;
  category: string;
  chapter_code: string | null;
  chapter_name: string | null;
  parent_code: string | null;
  search_terms: string[];
  is_billable: boolean;
  includes_note: string | null;
  excludes_note: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Resultado de búsqueda ICD10 (campos mínimos para UI)
 */
export interface ICD10SearchResult {
  code: string;
  description: string;
  category: string;
  chapter_name: string | null;
  chapter_code?: string | null;
}

/**
 * Respuesta de la API de búsqueda
 */
export interface ICD10SearchResponse {
  results: ICD10SearchResult[];
  count: number;
  query: string;
  responseTime?: number;
}

/**
 * Capítulo CIE-10
 */
export interface ICD10Chapter {
  code: string;
  name: string;
  count: number;
}

/**
 * Respuesta de la API de capítulos
 */
export interface ICD10ChaptersResponse {
  chapters: ICD10Chapter[];
  total: number;
}

/**
 * Props para el componente de búsqueda
 */
export interface ICD10SearchInputProps {
  /** Valor seleccionado (código) */
  value?: string;
  /** Callback cuando se selecciona un código */
  onSelect: (code: ICD10SearchResult) => void;
  /** Callback cuando se limpia la selección */
  onClear?: () => void;
  /** Placeholder del input */
  placeholder?: string;
  /** Deshabilitar el input */
  disabled?: boolean;
  /** Filtrar por capítulo específico */
  chapterFilter?: string;
  /** Clase CSS adicional */
  className?: string;
  /** Mostrar código seleccionado con descripción */
  showSelectedDescription?: boolean;
  /** ID para accessibility */
  id?: string;
  /** Nombre del campo para formularios */
  name?: string;
  /** Label del campo */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Campo requerido */
  required?: boolean;
}

/**
 * Estado interno del componente de búsqueda
 */
export interface ICD10SearchState {
  query: string;
  results: ICD10SearchResult[];
  isLoading: boolean;
  isOpen: boolean;
  error: string | null;
  selectedIndex: number;
}

/**
 * Capítulos CIE-10 (referencia estática)
 */
export const ICD10_CHAPTERS: Record<string, string> = {
  'A00-B99': 'Ciertas enfermedades infecciosas y parasitarias',
  'C00-D48': 'Neoplasias [tumores]',
  'D50-D89': 'Enfermedades de la sangre y de los órganos hematopoyéticos',
  'E00-E90': 'Enfermedades endocrinas, nutricionales y metabólicas',
  'F00-F99': 'Trastornos mentales y del comportamiento',
  'G00-G99': 'Enfermedades del sistema nervioso',
  'H00-H59': 'Enfermedades del ojo y sus anexos',
  'H60-H95': 'Enfermedades del oído y de la apófisis mastoides',
  'I00-I99': 'Enfermedades del sistema circulatorio',
  'J00-J99': 'Enfermedades del sistema respiratorio',
  'K00-K93': 'Enfermedades del sistema digestivo',
  'L00-L99': 'Enfermedades de la piel y del tejido subcutáneo',
  'M00-M99': 'Enfermedades del sistema osteomuscular y del tejido conectivo',
  'N00-N99': 'Enfermedades del sistema genitourinario',
  'O00-O99': 'Embarazo, parto y puerperio',
  'P00-P96': 'Ciertas afecciones originadas en el período perinatal',
  'Q00-Q99': 'Malformaciones congénitas, deformidades y anomalías cromosómicas',
  'R00-R99': 'Síntomas, signos y hallazgos anormales clínicos y de laboratorio',
  'S00-T98': 'Traumatismos, envenenamientos y otras consecuencias de causas externas',
  'V01-Y98': 'Causas externas de morbilidad y de mortalidad',
  'Z00-Z99': 'Factores que influyen en el estado de salud y contacto con los servicios de salud',
};

/**
 * Helper: Obtener nombre de capítulo por código
 */
export function getChapterName(chapterCode: string): string {
  return ICD10_CHAPTERS[chapterCode] || 'Capítulo desconocido';
}

/**
 * Helper: Validar formato de código CIE-10
 * Formato válido: Una letra seguida de 2-3 dígitos, opcionalmente seguido de punto y más dígitos
 * Ejemplos: I10, E11.9, M54.5, Z00.00
 */
export function isValidICD10Code(code: string): boolean {
  const pattern = /^[A-Z]\d{2}(\.\d{1,2})?$/i;
  return pattern.test(code);
}

/**
 * Helper: Formatear código CIE-10 (mayúsculas)
 */
export function formatICD10Code(code: string): string {
  return code.toUpperCase().trim();
}
