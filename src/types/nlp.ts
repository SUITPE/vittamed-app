/**
 * Types for NLP/AI Integration
 * TASK: VT-231
 */

export type AIProvider = 'openai' | 'anthropic' | 'deepseek';

export interface AICompletionOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface AIClient {
  complete(prompt: string, systemPrompt?: string, options?: AICompletionOptions): Promise<string>;
}

export interface DiagnosisSuggestion {
  diagnosis: string;
  icd10Code: string;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface DiagnosisSuggestionsResponse {
  success: boolean;
  suggestions?: DiagnosisSuggestion[];
  disclaimer?: string;
  error?: string;
  processingTimeMs?: number;
}
