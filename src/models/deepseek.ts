import OpenAI from 'openai';
import type { ModelProvider, StreamChunk, ChatOptions } from './types';
import type { Message } from '../tasks/types';
import type { Tool } from '../tools/base';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class DeepSeekProvider implements ModelProvider {
  id = 'deepseek';
  name = 'DeepSeek';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com'
    });
  }

  async *chat(
    messages: Message[],
    tools: Tool[],
    options?: ChatOptions
  ): AsyncIterable<StreamChunk> {
    const stream = await this.client.chat.completions.create({
      model: 'deepseek-chat',
      max_tokens: options?.maxTokens || 8000,
      temperature: options?.temperature || 1,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      tools: tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: zodToJsonSchema(t.inputSchema) as any
        }
      })),
      stream: true
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield { type: 'text', content: delta.content };
      }
    }

    yield { type: 'done' };
  }

  estimateCost(inputTokens: number, outputTokens: number): number {
    return (inputTokens * 0.0001 + outputTokens * 0.0002) / 1000;
  }
}
