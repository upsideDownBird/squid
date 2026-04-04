import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '../tasks/types';
import type { Tool } from './base';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface QueryOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class QueryEngine {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async *execute(
    messages: Message[],
    tools: Tool[],
    options?: QueryOptions
  ): AsyncIterable<{ type: string; content?: string }> {
    const stream = await this.client.messages.create({
      model: options?.model || 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens || 8000,
      temperature: options?.temperature || 1,
      messages: messages.map(m => ({
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
}
