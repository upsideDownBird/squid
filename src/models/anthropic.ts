import Anthropic from '@anthropic-ai/sdk';
import type { ModelProvider, StreamChunk, ChatOptions } from './types';
import type { Message } from '../tasks/types';
import type { Tool } from '../tools/base';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class AnthropicProvider implements ModelProvider {
  id = 'anthropic';
  name = 'Anthropic Claude';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *chat(
    messages: Message[],
    tools: Tool[],
    options?: ChatOptions
  ): AsyncIterable<StreamChunk> {
    const stream = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens || 8000,
      temperature: options?.temperature || 1,
      messages: messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: zodToJsonSchema(t.inputSchema) as any
      })),
      stream: true
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          yield { type: 'text', content: event.delta.text };
        }
      }
    }

    yield { type: 'done' };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens * 0.003 + outputTokens * 0.015) / 1000;
  }
}
