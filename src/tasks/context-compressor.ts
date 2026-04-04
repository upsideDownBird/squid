import type { Message } from '../tasks/types';

export interface CompactBoundary {
  index: number;
  timestamp: number;
}

export interface ContextCompressor {
  compress(messages: Message[], maxTokens: number): Message[];
  markBoundary(messages: Message[]): CompactBoundary;
}

export class DefaultContextCompressor implements ContextCompressor {
  private boundaries: CompactBoundary[] = [];

  compress(messages: Message[], maxTokens: number): Message[] {
    const estimatedTokens = this.estimateTokens(messages);

    if (estimatedTokens <= maxTokens) {
      return messages;
    }

    const systemMessages = messages.filter(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const keepCount = Math.floor(conversationMessages.length * 0.5);
    const recentMessages = conversationMessages.slice(-keepCount);

    return [...systemMessages, ...recentMessages];
  }

  markBoundary(messages: Message[]): CompactBoundary {
    const boundary: CompactBoundary = {
      index: messages.length,
      timestamp: Date.now()
    };
    this.boundaries.push(boundary);
    return boundary;
  }

  private estimateTokens(messages: Message[]): number {
    return messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
  }
}

export function freezeSystemPrompt(systemPrompt: string): Message {
  return {
    role: 'system',
    content: systemPrompt
  };
}
