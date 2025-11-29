/**
 * Anthropic Client
 *
 * Cliente para la API de Anthropic (Claude)
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

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicClient extends BaseAIClient {
  readonly provider: AIProvider = 'anthropic';
  private baseUrl: string;

  constructor(config: AIProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  }

  async chat(messages: ChatMessage[]): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API key not configured');
    }

    // Anthropic requiere separar el system prompt
    let systemPrompt = '';
    const anthropicMessages: AnthropicMessage[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemPrompt += (systemPrompt ? '\n\n' : '') + msg.content;
      } else {
        anthropicMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Anthropic requiere que el primer mensaje sea del usuario
    if (anthropicMessages.length === 0 || anthropicMessages[0].role !== 'user') {
      throw new Error('First message must be from user');
    }

    try {
      const response = await this.withRetry(async () => {
        const body: Record<string, unknown> = {
          model: this.config.model,
          messages: anthropicMessages,
          max_tokens: this.config.maxTokens || 2000,
        };

        if (systemPrompt) {
          body.system = systemPrompt;
        }

        const res = await fetch(`${this.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${res.status}`;
          throw new Error(errorMessage);
        }

        return res.json() as Promise<AnthropicResponse>;
      });

      const textContent = response.content.find((c) => c.type === 'text');

      return {
        content: textContent?.text || '',
        model: response.model,
        provider: this.provider,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: response.stop_reason || undefined,
      };
    } catch (error) {
      const aiError = this.handleError(error, 'Anthropic chat');
      throw new Error(`[${aiError.code}] ${aiError.message}`);
    }
  }
}

/**
 * Crear cliente Anthropic desde variables de entorno
 */
export function createAnthropicClient(
  model: string = 'claude-3-5-sonnet-20241022',
  options?: Partial<AIProviderConfig>
): AnthropicClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  return new AnthropicClient({
    provider: 'anthropic',
    model: model as AIProviderConfig['model'],
    apiKey,
    maxTokens: options?.maxTokens || 2000,
    temperature: options?.temperature ?? 0.3,
    baseUrl: options?.baseUrl,
  });
}
