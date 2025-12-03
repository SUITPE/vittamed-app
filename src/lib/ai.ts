/**
 * AI Client Factory and Utilities
 *
 * TASK: VT-232
 * Epic: Historias Clínicas Inteligentes
 *
 * Supports multiple AI providers: OpenAI, Anthropic, DeepSeek
 */

import type { AIProvider, AIClient, AICompletionResponse } from '@/types/nlp';

/**
 * Medical system prompts for different use cases
 */
export const MEDICAL_SYSTEM_PROMPTS = {
  diagnosis: `Eres un asistente médico especializado en diagnóstico diferencial.
Tu tarea es sugerir posibles diagnósticos basándote en los síntomas proporcionados.
ADVERTENCIA: Estas son SUGERENCIAS, no diagnósticos definitivos. Siempre requieren validación por un médico profesional.`,

  extraction: `Eres un asistente especializado en extracción de información médica.
Tu tarea es identificar síntomas, condiciones, medicamentos y alergias del texto clínico.
Responde SOLO con JSON válido.`,

  summary: `Eres un asistente especializado en resúmenes médicos.
Tu tarea es resumir historias clínicas de forma concisa y profesional.`,
};

/**
 * Get the default AI provider based on available API keys
 */
export function getDefaultProvider(): AIProvider | undefined {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.DEEPSEEK_API_KEY) return 'deepseek';
  return undefined;
}

/**
 * OpenAI Client Implementation
 */
class OpenAIClient implements AIClient {
  private apiKey: string;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY not configured');
    this.apiKey = key;
  }

  async complete(prompt: string, systemPrompt?: string): Promise<AICompletionResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: data.model,
      provider: 'openai',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }
}

/**
 * Anthropic Client Implementation
 */
class AnthropicClient implements AIClient {
  private apiKey: string;

  constructor() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
    this.apiKey = key;
  }

  async complete(prompt: string, systemPrompt?: string): Promise<AICompletionResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API error');
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      model: data.model,
      provider: 'anthropic',
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
    };
  }
}

/**
 * DeepSeek Client Implementation
 */
class DeepSeekClient implements AIClient {
  private apiKey: string;

  constructor() {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) throw new Error('DEEPSEEK_API_KEY not configured');
    this.apiKey = key;
  }

  async complete(prompt: string, systemPrompt?: string): Promise<AICompletionResponse> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'DeepSeek API error');
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      model: data.model,
      provider: 'deepseek',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }
}

/**
 * Create an AI client for the specified provider
 */
export function createAIClient(provider: AIProvider): AIClient {
  switch (provider) {
    case 'openai':
      return new OpenAIClient();
    case 'anthropic':
      return new AnthropicClient();
    case 'deepseek':
      return new DeepSeekClient();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}
