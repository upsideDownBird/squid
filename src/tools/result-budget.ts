import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import {
  persistToolResult,
  buildLargeToolResultMessage,
  isPersistError,
  DEFAULT_MAX_RESULT_SIZE_CHARS,
} from './tool-result-storage';

// 常量
export const MAX_TOOL_RESULTS_PER_MESSAGE_CHARS = 150_000;

// 消息类型定义
export type MessageRole = 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: Array<{
    type: string;
    tool_use_id?: string;
    [key: string]: any;
  }>;
}

// 内容替换状态
export interface ContentReplacementState {
  seenIds: Set<string>;
  replacements: Map<string, string>;
}

/**
 * 按 API 消息边界分组消息
 * 连续的用户消息会被合并为一组（因为 normalizeMessagesForAPI 会合并它们）
 */
export function groupMessagesByApiBlock(messages: Message[]): Message[][] {
  const groups: Message[][] = [];
  let currentGroup: Message[] = [];

  for (const msg of messages) {
    // 忽略非用户/助手消息
    if (msg.role !== 'user' && msg.role !== 'assistant') {
      continue;
    }

    if (msg.role === 'assistant') {
      // 助手消息创建边界
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    } else {
      // 用户消息添加到当前组
      currentGroup.push(msg);
    }
  }

  // 添加最后一组
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

/**
 * 选择最大的工具结果进行持久化
 */
export function selectLargestResults(
  toolResults: Array<{ toolUseId: string; content: string; size: number }>,
  targetReduction: number
): string[] {
  // 按大小降序排序
  const sorted = [...toolResults].sort((a, b) => b.size - a.size);

  const selected: string[] = [];
  let totalReduction = 0;

  for (const result of sorted) {
    if (totalReduction >= targetReduction) {
      break;
    }
    selected.push(result.toolUseId);
    totalReduction += result.size;
  }

  return selected;
}

/**
 * 计算内容大小
 */
function getContentSize(content: ToolResultBlockParam['content']): number {
  if (!content) return 0;
  if (typeof content === 'string') return content.length;
  return JSON.stringify(content).length;
}

/**
 * 检查工具是否豁免预算控制
 */
function isToolExempt(toolUseId: string, tools: Map<string, { maxResultSizeChars: number }>): boolean {
  const tool = tools.get(toolUseId);
  return tool ? !Number.isFinite(tool.maxResultSizeChars) : false;
}

/**
 * 执行消息级别的工具结果预算控制
 */
export async function enforceToolResultBudget(
  messages: Message[],
  sessionId: string,
  tools: Map<string, { name: string; maxResultSizeChars: number }>,
  state: ContentReplacementState = { seenIds: new Set(), replacements: new Map() }
): Promise<{ messages: Message[]; stats: { persisted: number; reapplied: number; shedBytes: number } }> {
  const groups = groupMessagesByApiBlock(messages);
  let totalPersisted = 0;
  let totalReapplied = 0;
  let totalShedBytes = 0;

  for (const group of groups) {
    // 收集该组中的所有工具结果
    const toolResults: Array<{
      messageIdx: number;
      blockIdx: number;
      toolUseId: string;
      content: ToolResultBlockParam['content'];
      size: number;
    }> = [];

    let totalSize = 0;

    group.forEach((msg, msgIdx) => {
      msg.content.forEach((block, blockIdx) => {
        if (block.type === 'tool_result' && block.tool_use_id) {
          const toolUseId = block.tool_use_id;

          // 检查是否已见过
          if (state.seenIds.has(toolUseId)) {
            // 重新应用缓存的替换
            if (state.replacements.has(toolUseId)) {
              block.content = state.replacements.get(toolUseId)!;
              totalReapplied++;
            }
            return;
          }

          // 标记为已见
          state.seenIds.add(toolUseId);

          // 检查是否豁免
          if (isToolExempt(toolUseId, tools)) {
            return;
          }

          const size = getContentSize(block.content);
          totalSize += size;

          toolResults.push({
            messageIdx: msgIdx,
            blockIdx,
            toolUseId,
            content: block.content,
            size,
          });
        }
      });
    });

    // 检查是否超预算
    if (totalSize <= MAX_TOOL_RESULTS_PER_MESSAGE_CHARS) {
      continue;
    }

    // 计算需要减少的大小
    const targetReduction = totalSize - MAX_TOOL_RESULTS_PER_MESSAGE_CHARS;

    // 选择最大的结果进行持久化
    const toPersist = selectLargestResults(
      toolResults.map(r => ({ toolUseId: r.toolUseId, content: '', size: r.size })),
      targetReduction
    );

    // 并发持久化
    const persistResults = await Promise.allSettled(
      toPersist.map(async toolUseId => {
        const result = toolResults.find(r => r.toolUseId === toolUseId);
        if (!result) return null;

        const persisted = await persistToolResult(
          result.content || '',
          toolUseId,
          sessionId
        );
        if (isPersistError(persisted)) {
          return null;
        }

        return { toolUseId, persisted, originalSize: result.size };
      })
    );

    // 应用替换
    for (const promiseResult of persistResults) {
      if (promiseResult.status === 'fulfilled' && promiseResult.value) {
        const { toolUseId, persisted, originalSize } = promiseResult.value;
        const result = toolResults.find(r => r.toolUseId === toolUseId);
        if (!result) continue;

        const message = buildLargeToolResultMessage(persisted);
        const msg = group[result.messageIdx];
        const block = msg.content[result.blockIdx] as any;
        block.content = message;

        // 缓存替换
        state.replacements.set(toolUseId, message);
        totalPersisted++;
        totalShedBytes += originalSize - message.length;
      }
    }
  }

  return {
    messages,
    stats: {
      persisted: totalPersisted,
      reapplied: totalReapplied,
      shedBytes: totalShedBytes,
    },
  };
}
