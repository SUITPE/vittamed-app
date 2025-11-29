/**
 * Base AI Client
 *
 * Interfaz abstracta para clientes de AI
 *
 * TASK: VT-231
 * Epic: Historias Clínicas Inteligentes
 */

import type {
  AIProvider,
  AIModel,
  AIProviderConfig,
  ChatMessage,
  AIResponse,
  AIError,
} from '@/types/nlp';

/**
 * Interfaz base para todos los clientes AI
 */
export interface IAIClient {
  readonly provider: AIProvider;
  readonly model: AIModel;

  /**
   * Enviar mensaje al modelo y obtener respuesta
   */
  chat(messages: ChatMessage[]): Promise<AIResponse>;

  /**
   * Completar texto (single prompt)
   */
  complete(prompt: string, systemPrompt?: string): Promise<AIResponse>;

  /**
   * Verificar si el cliente está configurado correctamente
   */
  isConfigured(): boolean;

  /**
   * Obtener información del modelo
   */
  getModelInfo(): { provider: AIProvider; model: AIModel; maxTokens: number };
}

/**
 * Clase base abstracta para clientes AI
 */
export abstract class BaseAIClient implements IAIClient {
  abstract readonly provider: AIProvider;
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  get model(): AIModel {
    return this.config.model;
  }

  abstract chat(messages: ChatMessage[]): Promise<AIResponse>;

  async complete(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    return this.chat(messages);
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  getModelInfo() {
    return {
      provider: this.provider,
      model: this.config.model,
      maxTokens: this.config.maxTokens || 2000,
    };
  }

  /**
   * Manejar errores de manera consistente
   */
  protected handleError(error: unknown, context?: string): AIError {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Detectar tipo de error
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      return {
        code: 'rate_limit',
        message: `Rate limit exceeded${context ? ` (${context})` : ''}`,
        provider: this.provider,
        retryAfter: 60,
      };
    }

    if (errorMessage.includes('invalid_api_key') || errorMessage.includes('401')) {
      return {
        code: 'invalid_api_key',
        message: `Invalid API key for ${this.provider}`,
        provider: this.provider,
      };
    }

    if (errorMessage.includes('context_length') || errorMessage.includes('too long')) {
      return {
        code: 'context_too_long',
        message: 'Input text exceeds model context length',
        provider: this.provider,
      };
    }

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('network')) {
      return {
        code: 'network_error',
        message: `Network error connecting to ${this.provider}`,
        provider: this.provider,
      };
    }

    return {
      code: 'unknown',
      message: errorMessage,
      provider: this.provider,
    };
  }

  /**
   * Retry con backoff exponencial
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // No retry para errores de API key
        if (lastError.message.includes('401') || lastError.message.includes('invalid_api_key')) {
          throw lastError;
        }

        // Solo retry para errores de rate limit o network
        if (
          !lastError.message.includes('429') &&
          !lastError.message.includes('rate limit') &&
          !lastError.message.includes('ECONNREFUSED')
        ) {
          throw lastError;
        }

        // Esperar con backoff exponencial
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

/**
 * Sistema de prompts médicos
 */
export const MEDICAL_SYSTEM_PROMPTS = {
  symptomAnalysis: `Eres un asistente médico especializado en análisis de síntomas.
Tu tarea es extraer información médica estructurada del texto proporcionado.

IMPORTANTE:
- NO proporciones diagnósticos definitivos
- Solo extrae y organiza la información mencionada
- Identifica síntomas, medicamentos, partes del cuerpo afectadas
- Si el texto menciona posibles diagnósticos, inclúyelos como "mencionados por el paciente"
- Responde SIEMPRE en español
- Usa terminología médica estándar cuando sea posible

Formato de respuesta JSON:
{
  "symptoms": [{"value": "...", "severity": "leve|moderado|severo", "duration": "..."}],
  "medications": [{"value": "...", "dosage": "..."}],
  "bodyParts": ["..."],
  "vitalSigns": [{"type": "...", "value": "..."}],
  "urgencyLevel": "low|medium|high|critical",
  "summary": "Resumen breve de la situación"
}`,

  clinicalSummary: `Eres un asistente médico especializado en documentación clínica.
Tu tarea es generar resúmenes clínicos profesionales.

IMPORTANTE:
- Mantén un tono profesional y objetivo
- Usa terminología médica estándar
- Estructura la información de forma clara
- No agregues información que no esté en el texto original
- Responde SIEMPRE en español`,

  diagnosisSuggestion: `Eres un asistente médico que ayuda a identificar posibles diagnósticos.

ADVERTENCIA OBLIGATORIA: Las sugerencias son solo orientativas y requieren validación por un profesional médico.

Tu tarea:
- Analizar los síntomas descritos
- Sugerir diagnósticos diferenciales posibles
- Incluir códigos CIE-10 cuando sea posible
- Indicar nivel de confianza (bajo/medio/alto)
- Responder SIEMPRE en español

Formato JSON:
{
  "suggestions": [
    {"diagnosis": "...", "icd10": "...", "confidence": "low|medium|high", "reasoning": "..."}
  ],
  "disclaimer": "Estas sugerencias requieren validación médica profesional"
}`,
};
