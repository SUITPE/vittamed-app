/**
 * OpenAI Client
 *
 * Cliente para la API de OpenAI (GPT-4, GPT-3.5)
 *
 * TASK: VT-231
 * Epic: Historias Clínicas Inteligentes
 */

import { BaseAIClient } from './base-client';
import type {
  AIProvider,
  AIProviderConfig,
  ChatMessage,
  AIResponse,
  PROVIDER_BASE_URLS,
} from '@/types/nlp';

interface OpenAIChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIClient extends BaseAIClient {
  readonly provider: AIProvider = 'openai';
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    const openaiMessages: OpenAIChatCompletionMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await this.withRetry(async () => {
        const res = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: openaiMessages,
            max_tokens: this.config.maxTokens || 2000,
            temperature: this.config.temperature ?? 0.3,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${res.status}`;
          throw new Error(errorMessage);
        }

        return res.json() as Promise<OpenAIChatCompletionResponse>;
      });

      const choice = response.choices[0];

      return {
        content: choice?.message?.content || '',
        model: response.model,
        provider: this.provider,
        usage: response.usage
          ? {
              promptTokens: response.usage.prompt_tokens,
              completionTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
        finishReason: choice?.finish_reason,
      };
    } catch (error) {
      const aiError = this.handleError(error, 'OpenAI chat');
      throw new Error(`[${aiError.code}] ${aiError.message}`);
    }
  }
}

/**
 * Crear cliente OpenAI desde variables de entorno
 */
export function createOpenAIClient(
  model: string = 'gpt-4o',
  options?: Partial<AIProviderConfig>
): OpenAIClient {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  return new OpenAIClient({
    provider: 'openai',
    model: model as AIProviderConfig['model'],
    apiKey,
    maxTokens: options?.maxTokens || 2000,
    temperature: options?.temperature ?? 0.3,
    baseUrl: options?.baseUrl,
  });
}
