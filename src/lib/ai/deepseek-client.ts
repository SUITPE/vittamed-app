/**
 * DeepSeek Client
 *
 * Cliente para la API de DeepSeek
 * DeepSeek usa una API compatible con OpenAI
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
} from '@/types/nlp';

interface DeepSeekChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekChatResponse {
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

export class DeepSeekClient extends BaseAIClient {
  readonly provider: AIProvider = 'deepseek';
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.deepseek.com/v1';
  }

  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('DeepSeek API key not configured');
    }

    const deepseekMessages: DeepSeekChatMessage[] = messages.map((msg) => ({
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
            messages: deepseekMessages,
            max_tokens: this.config.maxTokens || 2000,
            temperature: this.config.temperature ?? 0.3,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${res.status}`;
          throw new Error(errorMessage);
        }

        return res.json() as Promise<DeepSeekChatResponse>;
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
      const aiError = this.handleError(error, 'DeepSeek chat');
      throw new Error(`[${aiError.code}] ${aiError.message}`);
    }
  }
}

/**
 * Crear cliente DeepSeek desde variables de entorno
 */
export function createDeepSeekClient(
  model: string = 'deepseek-chat',
  options?: Partial<AIProviderConfig>
): DeepSeekClient {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY environment variable not set');
  }

  return new DeepSeekClient({
    provider: 'deepseek',
    model: model as AIProviderConfig['model'],
    apiKey,
    maxTokens: options?.maxTokens || 2000,
    temperature: options?.temperature ?? 0.3,
    baseUrl: options?.baseUrl,
  });
}
