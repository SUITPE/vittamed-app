/**
 * AI Client Factory
 * TASK: VT-231
 *
 * Provides unified interface for multiple AI providers
 */

import type { AIProvider, AIClient, AICompletionOptions } from '@/types/nlp';

/**
 * Get default AI provider from environment
 */
export function getDefaultProvider(): AIProvider | null {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.DEEPSEEK_API_KEY) return 'deepseek';
  return null;
}

/**
 * Create AI client for specified provider
 */
export function createAIClient(provider: AIProvider): AIClient {
  switch (provider) {
    case 'openai':
      return createOpenAIClient();
    case 'anthropic':
      return createAnthropicClient();
    case 'deepseek':
      return createDeepSeekClient();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

function createOpenAIClient(): AIClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  return {
    async complete(prompt: string, systemPrompt?: string, options?: AICompletionOptions): Promise<string> {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    },
  };
}

function createAnthropicClient(): AIClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  return {
    async complete(prompt: string, systemPrompt?: string, options?: AICompletionOptions): Promise<string> {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: options?.maxTokens || 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0]?.text || '';
    },
  };
}

function createDeepSeekClient(): AIClient {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY not configured');

  return {
    async complete(prompt: string, systemPrompt?: string, options?: AICompletionOptions): Promise<string> {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    },
  };
}
