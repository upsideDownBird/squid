// Conversation history compressor with 4-layer progressive strategy
import type { Message } from './manager';

const MICROCOMPACT_THRESHOLD = 0.70;
const TRUNCATE_THRESHOLD = 0.75;
const PARTIAL_COMPACT_THRESHOLD = 0.80;
const FULL_COMPACT_THRESHOLD = 0.85;

const KEEP_RECENT_MESSAGES = 20;
const KEEP_RECENT_AFTER_COMPACT = 10;

export interface CompressionResult {
  messages: Message[];
  compressed: boolean;
  strategy: 'none' | 'microcompact' | 'truncate' | 'partial' | 'full';
  tokensSaved: number;
}

export class ConversationCompressor {
  private modelContextLimit: number;

  constructor(modelContextLimit: number = 100000) {
    this.modelContextLimit = modelContextLimit;
  }

  // Estimate token count (rough approximation: 1 token ≈ 4 characters)
  private estimateTokens(messages: Message[]): number {
    let total = 0;
    for (const msg of messages) {
      total += Math.ceil(msg.content.length / 4);
    }
    return total;
  }

  // Layer 1: Microcompact - Remove redundant content
  private microcompact(messages: Message[]): Message[] {
    const result: Message[] = [];
    let toolCallCount = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];

      // Keep recent 5 tool calls, remove older ones
      if (msg.role === 'tool' || msg.content.includes('tool_result')) {
        toolCallCount++;
        if (toolCallCount > 5) {
          continue; // Skip old tool results
        }
      }

      // Remove thinking blocks (if any)
      let content = msg.content;
      if (content.includes('<thinking>')) {
        content = content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '[思考过程已省略]');
      }

      // Truncate very long file contents
      if (content.length > 10000 && content.includes('```')) {
        content = content.substring(0, 10000) + '\n...[内容已截断]';
      }

      result.unshift({ ...msg, content });
    }

    return result;
  }

  // Layer 2: Smart Truncation - Keep recent messages only
  private truncate(messages: Message[]): Message[] {
    if (messages.length <= KEEP_RECENT_MESSAGES) {
      return messages;
    }

    const truncated = messages.slice(-KEEP_RECENT_MESSAGES);

    // Add truncation marker at the beginning
    return [
      {
        role: 'system',
        content: '[早期对话已截断，以下是最近的对话内容]',
        timestamp: truncated[0].timestamp
      },
      ...truncated
    ];
  }

  // Layer 3: Partial Compact - Summarize middle section (requires AI)
  private async partialCompact(
    messages: Message[],
    aiSummarizeFn?: (messages: Message[]) => Promise<string>
  ): Promise<Message[]> {
    if (messages.length <= 30 || !aiSummarizeFn) {
      return this.truncate(messages);
    }

    const keepStart = 10;
    const keepEnd = 20;
    const middleSection = messages.slice(keepStart, -keepEnd);

    try {
      const summary = await aiSummarizeFn(middleSection);

      return [
        ...messages.slice(0, keepStart),
        {
          role: 'system',
          content: `[中间对话摘要]\n${summary}`,
          timestamp: middleSection[0].timestamp
        },
        ...messages.slice(-keepEnd)
      ];
    } catch (error) {
      console.error('Partial compact failed, falling back to truncation:', error);
      return this.truncate(messages);
    }
  }

  // Layer 4: Full Compact - Comprehensive summary (requires AI)
  private async fullCompact(
    messages: Message[],
    aiSummarizeFn?: (messages: Message[]) => Promise<string>
  ): Promise<Message[]> {
    if (messages.length <= KEEP_RECENT_AFTER_COMPACT || !aiSummarizeFn) {
      return this.truncate(messages);
    }

    const oldMessages = messages.slice(0, -KEEP_RECENT_AFTER_COMPACT);
    const recentMessages = messages.slice(-KEEP_RECENT_AFTER_COMPACT);

    try {
      const summary = await aiSummarizeFn(oldMessages);

      return [
        {
          role: 'system',
          content: `[对话历史摘要]\n\n${summary}\n\n---\n以下是最近的对话：`,
          timestamp: oldMessages[0].timestamp
        },
        ...recentMessages
      ];
    } catch (error) {
      console.error('Full compact failed, falling back to truncation:', error);
      return this.truncate(messages);
    }
  }

  // Main compression method with progressive strategy
  async compress(
    messages: Message[],
    aiSummarizeFn?: (messages: Message[]) => Promise<string>
  ): Promise<CompressionResult> {
    const initialTokens = this.estimateTokens(messages);
    const usage = initialTokens / this.modelContextLimit;

    let result = messages;
    let strategy: CompressionResult['strategy'] = 'none';

    // Layer 1: Microcompact
    if (usage > MICROCOMPACT_THRESHOLD) {
      result = this.microcompact(result);
      strategy = 'microcompact';

      const newUsage = this.estimateTokens(result) / this.modelContextLimit;
      if (newUsage < TRUNCATE_THRESHOLD) {
        return {
          messages: result,
          compressed: true,
          strategy,
          tokensSaved: initialTokens - this.estimateTokens(result)
        };
      }
    }

    // Layer 2: Smart Truncation
    if (usage > TRUNCATE_THRESHOLD) {
      result = this.truncate(result);
      strategy = 'truncate';

      const newUsage = this.estimateTokens(result) / this.modelContextLimit;
      if (newUsage < PARTIAL_COMPACT_THRESHOLD) {
        return {
          messages: result,
          compressed: true,
          strategy,
          tokensSaved: initialTokens - this.estimateTokens(result)
        };
      }
    }

    // Layer 3: Partial Compact
    if (usage > PARTIAL_COMPACT_THRESHOLD && aiSummarizeFn) {
      result = await this.partialCompact(result, aiSummarizeFn);
      strategy = 'partial';

      const newUsage = this.estimateTokens(result) / this.modelContextLimit;
      if (newUsage < FULL_COMPACT_THRESHOLD) {
        return {
          messages: result,
          compressed: true,
          strategy,
          tokensSaved: initialTokens - this.estimateTokens(result)
        };
      }
    }

    // Layer 4: Full Compact
    if (usage > FULL_COMPACT_THRESHOLD && aiSummarizeFn) {
      result = await this.fullCompact(result, aiSummarizeFn);
      strategy = 'full';
    }

    return {
      messages: result,
      compressed: strategy !== 'none',
      strategy,
      tokensSaved: initialTokens - this.estimateTokens(result)
    };
  }

  // Manual compression trigger
  async manualCompress(
    messages: Message[],
    aiSummarizeFn?: (messages: Message[]) => Promise<string>
  ): Promise<CompressionResult> {
    // Force full compact for manual trigger
    const result = await this.fullCompact(messages, aiSummarizeFn);
    const initialTokens = this.estimateTokens(messages);

    return {
      messages: result,
      compressed: true,
      strategy: 'full',
      tokensSaved: initialTokens - this.estimateTokens(result)
    };
  }

  // Get current usage percentage
  getUsagePercentage(messages: Message[]): number {
    const tokens = this.estimateTokens(messages);
    return (tokens / this.modelContextLimit) * 100;
  }
}
