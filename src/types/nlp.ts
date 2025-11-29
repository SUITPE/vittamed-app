/**
 * NLP Types
 *
 * Tipos para procesamiento de lenguaje natural en historias clínicas
 *
 * TASK: VT-231
 * Epic: Historias Clínicas Inteligentes
 */

/**
 * Proveedores de AI soportados
 */
export type AIProvider = 'openai' | 'anthropic' | 'deepseek';

/**
 * Modelos disponibles por proveedor
 */
export type OpenAIModel = 'gpt-4' | 'gpt-4-turbo' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo';
export type AnthropicModel = 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022' | 'claude-3-opus-20240229';
export type DeepSeekModel = 'deepseek-chat' | 'deepseek-coder';

export type AIModel = OpenAIModel | AnthropicModel | DeepSeekModel;

/**
 * Configuración del proveedor AI
 */
export interface AIProviderConfig {
  provider: AIProvider;
  model: AIModel;
  apiKey: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Mensaje para el chat
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Respuesta del modelo AI
 */
export interface AIResponse {
  content: string;
  model: string;
  provider: AIProvider;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

/**
 * Entidad médica extraída del texto
 */
export interface MedicalEntity {
  type: 'symptom' | 'diagnosis' | 'medication' | 'procedure' | 'body_part' | 'vital_sign' | 'duration' | 'severity';
  value: string;
  normalizedValue?: string;
  confidence: number;
  startIndex?: number;
  endIndex?: number;
  icd10Code?: string;
}

/**
 * Resultado del análisis de síntomas
 */
export interface SymptomAnalysisResult {
  /** Síntomas identificados */
  symptoms: MedicalEntity[];
  /** Diagnósticos sugeridos (si aplica) */
  suggestedDiagnoses?: MedicalEntity[];
  /** Medicamentos mencionados */
  medications?: MedicalEntity[];
  /** Partes del cuerpo afectadas */
  bodyParts?: MedicalEntity[];
  /** Signos vitales mencionados */
  vitalSigns?: MedicalEntity[];
  /** Resumen generado */
  summary?: string;
  /** Nivel de urgencia estimado */
  urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
  /** Proveedor usado */
  provider: AIProvider;
  /** Modelo usado */
  model: string;
  /** Tiempo de procesamiento en ms */
  processingTime: number;
}

/**
 * Request para análisis de síntomas
 */
export interface AnalyzeSymptomsRequest {
  /** Texto a analizar (puede ser transcripción de voz o texto escrito) */
  text: string;
  /** Contexto adicional del paciente */
  patientContext?: {
    age?: number;
    gender?: 'M' | 'F' | 'other';
    knownConditions?: string[];
    currentMedications?: string[];
    allergies?: string[];
  };
  /** Proveedor preferido (opcional, usa default si no se especifica) */
  provider?: AIProvider;
  /** Incluir sugerencias de diagnóstico */
  includeDiagnosisSuggestions?: boolean;
  /** Idioma del texto */
  language?: 'es' | 'en';
}

/**
 * Respuesta del endpoint de análisis de síntomas
 */
export interface AnalyzeSymptomsResponse {
  success: boolean;
  data?: SymptomAnalysisResult;
  error?: string;
}

/**
 * Request para generar resumen clínico
 */
export interface GenerateSummaryRequest {
  /** Notas SOAP o texto clínico */
  clinicalNotes: string;
  /** Tipo de resumen */
  summaryType: 'brief' | 'detailed' | 'referral';
  /** Proveedor preferido */
  provider?: AIProvider;
}

/**
 * Respuesta de resumen clínico
 */
export interface GenerateSummaryResponse {
  success: boolean;
  summary?: string;
  provider?: AIProvider;
  error?: string;
}

/**
 * Configuración de rate limiting
 */
export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxTokensPerMinute: number;
}

/**
 * Error de AI
 */
export interface AIError {
  code: 'rate_limit' | 'invalid_api_key' | 'model_not_available' | 'context_too_long' | 'network_error' | 'unknown';
  message: string;
  provider: AIProvider;
  retryAfter?: number;
}

/**
 * Configuración por defecto
 */
export const DEFAULT_AI_CONFIG: Partial<AIProviderConfig> = {
  maxTokens: 2000,
  temperature: 0.3, // Bajo para respuestas más consistentes en contexto médico
};

/**
 * Modelos recomendados por proveedor
 */
export const RECOMMENDED_MODELS: Record<AIProvider, AIModel> = {
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-20241022',
  deepseek: 'deepseek-chat',
};

/**
 * URLs base de los proveedores
 */
export const PROVIDER_BASE_URLS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
};
