/**
 * AI Clients Unit Tests
 *
 * Tests for OpenAI, Anthropic, and DeepSeek clients
 *
 * TASK: VT-231
 * Epic: Historias Clínicas Inteligentes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIClient } from '@/lib/ai/openai-client';
import { AnthropicClient } from '@/lib/ai/anthropic-client';
import { DeepSeekClient } from '@/lib/ai/deepseek-client';
import { MEDICAL_SYSTEM_PROMPTS } from '@/lib/ai/base-client';
import type { AIProviderConfig, ChatMessage } from '@/types/nlp';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AI Clients', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('OpenAIClient', () => {
    const config: AIProviderConfig = {
      provider: 'openai',
      model: 'gpt-4o',
      apiKey: 'test-openai-key',
      maxTokens: 2000,
      temperature: 0.3,
    };

    it('should initialize with correct provider', () => {
      const client = new OpenAIClient(config);
      expect(client.provider).toBe('openai');
      expect(client.model).toBe('gpt-4o');
    });

    it('should return model info', () => {
      const client = new OpenAIClient(config);
      const info = client.getModelInfo();
      expect(info.provider).toBe('openai');
      expect(info.model).toBe('gpt-4o');
      expect(info.maxTokens).toBe(2000);
    });

    it('should report configured status', () => {
      const client = new OpenAIClient(config);
      expect(client.isConfigured()).toBe(true);

      const unconfiguredClient = new OpenAIClient({ ...config, apiKey: '' });
      expect(unconfiguredClient.isConfigured()).toBe(false);
    });

    it('should call OpenAI API correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          object: 'chat.completion',
          created: 1234567890,
          model: 'gpt-4o',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'Test response' },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
        }),
      });

      const client = new OpenAIClient(config);
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
      const response = await client.chat(messages);

      expect(response.content).toBe('Test response');
      expect(response.provider).toBe('openai');
      expect(response.model).toBe('gpt-4o');
      expect(response.usage?.totalTokens).toBe(15);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      });

      const client = new OpenAIClient(config);
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

      await expect(client.chat(messages)).rejects.toThrow('Invalid API key');
    });

    it('should throw error when not configured', async () => {
      const unconfiguredClient = new OpenAIClient({ ...config, apiKey: '' });
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];

      await expect(unconfiguredClient.chat(messages)).rejects.toThrow(
        'OpenAI API key not configured'
      );
    });

    it('should use complete method with system prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          object: 'chat.completion',
          created: 1234567890,
          model: 'gpt-4o',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'Medical analysis' },
              finish_reason: 'stop',
            },
          ],
        }),
      });

      const client = new OpenAIClient(config);
      const response = await client.complete(
        'Analyze symptoms',
        'You are a medical assistant'
      );

      expect(response.content).toBe('Medical analysis');

      // Verify system prompt was included
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.messages).toHaveLength(2);
      expect(body.messages[0].role).toBe('system');
    });
  });

  describe('AnthropicClient', () => {
    const config: AIProviderConfig = {
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      apiKey: 'test-anthropic-key',
      maxTokens: 2000,
    };

    it('should initialize with correct provider', () => {
      const client = new AnthropicClient(config);
      expect(client.provider).toBe('anthropic');
      expect(client.model).toBe('claude-3-5-sonnet-20241022');
    });

    it('should separate system prompt correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Test response from Claude' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      });

      const client = new AnthropicClient(config);
      const messages: ChatMessage[] = [
        { role: 'system', content: 'You are a medical assistant' },
        { role: 'user', content: 'Analyze symptoms' },
      ];
      const response = await client.chat(messages);

      expect(response.content).toBe('Test response from Claude');
      expect(response.provider).toBe('anthropic');

      // Verify system prompt was sent separately
      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.system).toBe('You are a medical assistant');
      expect(body.messages).toHaveLength(1);
    });

    it('should calculate total tokens correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Response' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          usage: { input_tokens: 100, output_tokens: 50 },
        }),
      });

      const client = new AnthropicClient(config);
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
      const response = await client.chat(messages);

      expect(response.usage?.promptTokens).toBe(100);
      expect(response.usage?.completionTokens).toBe(50);
      expect(response.usage?.totalTokens).toBe(150);
    });

    it('should throw error if first message is not from user', async () => {
      const client = new AnthropicClient(config);
      const messages: ChatMessage[] = [
        { role: 'assistant', content: 'Hello' },
      ];

      await expect(client.chat(messages)).rejects.toThrow(
        'First message must be from user'
      );
    });

    it('should use correct headers for Anthropic API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Response' }],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      });

      const client = new AnthropicClient(config);
      await client.chat([{ role: 'user', content: 'Hello' }]);

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers['x-api-key']).toBe('test-anthropic-key');
      expect(fetchCall[1].headers['anthropic-version']).toBe('2023-06-01');
    });
  });

  describe('DeepSeekClient', () => {
    const config: AIProviderConfig = {
      provider: 'deepseek',
      model: 'deepseek-chat',
      apiKey: 'test-deepseek-key',
      maxTokens: 2000,
    };

    it('should initialize with correct provider', () => {
      const client = new DeepSeekClient(config);
      expect(client.provider).toBe('deepseek');
      expect(client.model).toBe('deepseek-chat');
    });

    it('should use OpenAI-compatible API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          object: 'chat.completion',
          created: 1234567890,
          model: 'deepseek-chat',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'DeepSeek response' },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 8,
            completion_tokens: 4,
            total_tokens: 12,
          },
        }),
      });

      const client = new DeepSeekClient(config);
      const messages: ChatMessage[] = [{ role: 'user', content: 'Hello' }];
      const response = await client.chat(messages);

      expect(response.content).toBe('DeepSeek response');
      expect(response.provider).toBe('deepseek');

      // Verify correct endpoint
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toContain('deepseek.com');
    });

    it('should use Bearer token authentication', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test-id',
          object: 'chat.completion',
          created: 1234567890,
          model: 'deepseek-chat',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'Response' },
              finish_reason: 'stop',
            },
          ],
        }),
      });

      const client = new DeepSeekClient(config);
      await client.chat([{ role: 'user', content: 'Hello' }]);

      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[1].headers['Authorization']).toBe(
        'Bearer test-deepseek-key'
      );
    });
  });
});

describe('MEDICAL_SYSTEM_PROMPTS', () => {
  it('should export symptomAnalysis prompt in Spanish', () => {
    expect(MEDICAL_SYSTEM_PROMPTS.symptomAnalysis).toBeDefined();
    expect(MEDICAL_SYSTEM_PROMPTS.symptomAnalysis).toContain('síntomas');
    expect(MEDICAL_SYSTEM_PROMPTS.symptomAnalysis).toContain('JSON');
  });

  it('should export clinicalSummary prompt', () => {
    expect(MEDICAL_SYSTEM_PROMPTS.clinicalSummary).toBeDefined();
    expect(MEDICAL_SYSTEM_PROMPTS.clinicalSummary).toContain('clínica');
  });

  it('should export diagnosisSuggestion prompt with disclaimer', () => {
    expect(MEDICAL_SYSTEM_PROMPTS.diagnosisSuggestion).toBeDefined();
    expect(MEDICAL_SYSTEM_PROMPTS.diagnosisSuggestion).toContain('diagnóstico');
    expect(MEDICAL_SYSTEM_PROMPTS.diagnosisSuggestion).toContain('CIE-10');
  });

  it('should have proper JSON format instructions', () => {
    expect(MEDICAL_SYSTEM_PROMPTS.symptomAnalysis).toContain('symptoms');
    expect(MEDICAL_SYSTEM_PROMPTS.symptomAnalysis).toContain('medications');
    expect(MEDICAL_SYSTEM_PROMPTS.symptomAnalysis).toContain('urgencyLevel');
  });
});
