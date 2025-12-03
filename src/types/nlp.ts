/**
 * NLP and AI Types
 *
 * TASK: VT-232
 * Epic: Historias Clínicas Inteligentes
 */

/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'anthropic' | 'deepseek';

/**
 * AI completion response
 */
export interface AICompletionResponse {
  content: string;
  model: string;
  provider: AIProvider;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * AI client interface
 */
export interface AIClient {
  complete(prompt: string, systemPrompt?: string): Promise<AICompletionResponse>;
}

/**
 * NLP extraction result
 */
export interface NLPExtractionResult {
  symptoms: string[];
  conditions: string[];
  medications: string[];
  allergies: string[];
  confidence: number;
}
