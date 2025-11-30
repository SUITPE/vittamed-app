/**
 * AI Module
 *
 * Módulo central para integración con proveedores de AI
 *
 * TASK: VT-231
 * Epic: Historias Clínicas Inteligentes
 *
 * Proveedores soportados:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude)
 * - DeepSeek
 */

export { BaseAIClient, MEDICAL_SYSTEM_PROMPTS } from './base-client';
export type { IAIClient } from './base-client';

export { OpenAIClient, createOpenAIClient } from './openai-client';
export { AnthropicClient, createAnthropicClient } from './anthropic-client';
export { DeepSeekClient, createDeepSeekClient } from './deepseek-client';

import type {
  AIProvider,
  AIProviderConfig,
  AIModel,
  RECOMMENDED_MODELS,
} from '@/types/nlp';

import { OpenAIClient } from './openai-client';
import { AnthropicClient } from './anthropic-client';
import { DeepSeekClient } from './deepseek-client';
import type { IAIClient } from './base-client';

/**
 * Factory para crear cliente AI según el proveedor
 */
export function createAIClient(
  provider: AIProvider,
  model?: AIModel,
  options?: Partial<AIProviderConfig>
): IAIClient {
  const defaultModels: Record<AIProvider, AIModel> = {
    openai: 'gpt-4o',
    anthropic: 'claude-3-5-sonnet-20241022',
    deepseek: 'deepseek-chat',
  };

  const selectedModel = model || defaultModels[provider];

  switch (provider) {
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      return new OpenAIClient({
        provider: 'openai',
        model: selectedModel,
        apiKey,
        ...options,
      });
    }

    case 'anthropic': {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }
      return new AnthropicClient({
        provider: 'anthropic',
        model: selectedModel,
        apiKey,
        ...options,
      });
    }

    case 'deepseek': {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        throw new Error('DEEPSEEK_API_KEY not configured');
      }
      return new DeepSeekClient({
        provider: 'deepseek',
        model: selectedModel,
        apiKey,
        ...options,
      });
    }

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Obtener el proveedor por defecto configurado
 * Prioridad: OpenAI > Anthropic > DeepSeek
 */
export function getDefaultProvider(): AIProvider | null {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.DEEPSEEK_API_KEY) return 'deepseek';
  return null;
}

/**
 * Verificar qué proveedores están configurados
 */
export function getConfiguredProviders(): AIProvider[] {
  const providers: AIProvider[] = [];
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic');
  if (process.env.DEEPSEEK_API_KEY) providers.push('deepseek');
  return providers;
}

/**
 * Crear cliente con el proveedor por defecto
 */
export function createDefaultAIClient(options?: Partial<AIProviderConfig>): IAIClient {
  const provider = getDefaultProvider();
  if (!provider) {
    throw new Error(
      'No AI provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or DEEPSEEK_API_KEY'
    );
  }
  return createAIClient(provider, undefined, options);
}
