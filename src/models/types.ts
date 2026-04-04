import type { Message } from '../tasks/types';
import type { Tool } from '../tools/base';

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'done';
  content?: string;
  toolCall?: {
    id: string;
    name: string;
    input: any;
  };
  toolResult?: {
    id: string;
    output: any;
  };
}

export interface ModelProvider {
  id: string;
  name: string;

  chat(
    messages: Message[],
    tools: Tool[],
    options?: ChatOptions
  ): AsyncIterable<StreamChunk>;

  estimateCost(inputTokens: number, outputTokens: number): number;
}
