import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';

// 常量定义
export const DEFAULT_MAX_RESULT_SIZE_CHARS = 50_000;
export const PREVIEW_SIZE_BYTES = 2_000;
export const TOOL_RESULTS_SUBDIR = 'tool-results';
export const PERSISTED_OUTPUT_TAG = '<persisted-output>';
export const PERSISTED_OUTPUT_CLOSING_TAG = '</persisted-output>';

// 持久化结果类型
export type PersistedToolResult = {
  filepath: string;
  originalSize: number;
  isJson: boolean;
  preview: string;
  hasMore: boolean;
};

// 错误结果类型
export type PersistToolResultError = {
  error: string;
};

/**
 * 获取会话目录
 */
function getSessionDir(sessionId: string): string {
  return join(homedir(), '.squid', 'sessions', sessionId);
}

/**
 * 获取工具结果存储目录
 */
export function getToolResultsDir(sessionId: string): string {
  return join(getSessionDir(sessionId), TOOL_RESULTS_SUBDIR);
}

/**
 * 生成工具结果文件路径
 */
export function getToolResultPath(sessionId: string, toolUseId: string, isJson: boolean): string {
  const ext = isJson ? 'json' : 'txt';
  return join(getToolResultsDir(sessionId), `${toolUseId}.${ext}`);
}

/**
 * 确保工具结果目录存在
 */
export async function ensureToolResultsDir(sessionId: string): Promise<void> {
  try {
    await mkdir(getToolResultsDir(sessionId), { recursive: true });
  } catch {
    // 目录可能已存在
  }
}

/**
 * 生成预览内容
 * 在换行边界截断以避免切断单词或行
 */
export function generatePreview(
  content: string,
  maxBytes: number
): { preview: string; hasMore: boolean } {
  if (content.length <= maxBytes) {
    return { preview: content, hasMore: false };
  }

  // 在限制内查找最后一个换行符
  const truncated = content.slice(0, maxBytes);
  const lastNewline = truncated.lastIndexOf('\n');

  // 如果换行符在预览大小的 50% 之后，使用它
  // 否则使用精确限制
  const cutPoint = lastNewline > maxBytes * 0.5 ? lastNewline : maxBytes;

  return { preview: content.slice(0, cutPoint), hasMore: true };
}

/**
 * 格式化文件大小为人类可读格式
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * 持久化工具结果到磁盘
 */
export async function persistToolResult(
  content: NonNullable<ToolResultBlockParam['content']>,
  toolUseId: string,
  sessionId: string
): Promise<PersistedToolResult | PersistToolResultError> {
  const isJson = Array.isArray(content);

  // 检查非文本内容
  if (isJson) {
    const hasNonTextContent = content.some(block => block.type !== 'text');
    if (hasNonTextContent) {
      return {
        error: 'Cannot persist tool results containing non-text content',
      };
    }
  }

  await ensureToolResultsDir(sessionId);
  const filepath = getToolResultPath(sessionId, toolUseId, isJson);
  const contentStr = isJson ? JSON.stringify(content, null, 2) : content;

  // 使用 'wx' flag 避免重复写入
  try {
    await writeFile(filepath, contentStr, { encoding: 'utf-8', flag: 'wx' });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      return { error: `Failed to persist tool result: ${error.message}` };
    }
    // 文件已存在，继续生成预览
  }

  // 生成预览
  const { preview, hasMore } = generatePreview(contentStr, PREVIEW_SIZE_BYTES);

  return {
    filepath,
    originalSize: contentStr.length,
    isJson,
    preview,
    hasMore,
  };
}

/**
 * 构建大结果的预览消息
 */
export function buildLargeToolResultMessage(result: PersistedToolResult): string {
  let message = `${PERSISTED_OUTPUT_TAG}\n`;
  message += `Output too large (${formatFileSize(result.originalSize)}). Full output saved to: ${result.filepath}\n\n`;
  message += `Preview (first ${formatFileSize(PREVIEW_SIZE_BYTES)}):\n`;
  message += result.preview;
  message += result.hasMore ? '\n...\n' : '\n';
  message += PERSISTED_OUTPUT_CLOSING_TAG;
  return message;
}

/**
 * 类型守卫：检查是否为持久化错误
 */
export function isPersistError(
  result: PersistedToolResult | PersistToolResultError
): result is PersistToolResultError {
  return 'error' in result;
}

/**
 * 检查工具结果内容是否为空
 */
export function isToolResultContentEmpty(
  content: ToolResultBlockParam['content']
): boolean {
  if (!content) return true;
  if (typeof content === 'string') return content.trim() === '';
  if (!Array.isArray(content)) return false;
  if (content.length === 0) return true;
  return content.every(
    block =>
      typeof block === 'object' &&
      'type' in block &&
      block.type === 'text' &&
      'text' in block &&
      (typeof block.text !== 'string' || block.text.trim() === '')
  );
}

/**
 * 处理工具结果块，可能持久化大结果
 */
export async function processToolResultBlock<T>(
  tool: {
    name: string;
    maxResultSizeChars: number;
    mapToolResultToToolResultBlockParam: (
      result: T,
      toolUseID: string
    ) => ToolResultBlockParam;
  },
  toolUseResult: T,
  toolUseID: string,
  sessionId: string
): Promise<ToolResultBlockParam> {
  // 调用工具的映射方法
  const toolResultBlock = tool.mapToolResultToToolResultBlockParam(
    toolUseResult,
    toolUseID
  );

  // 处理空结果
  if (isToolResultContentEmpty(toolResultBlock.content)) {
    return {
      ...toolResultBlock,
      content: `(${tool.name} completed with no output)`,
    };
  }

  const content = toolResultBlock.content;
  if (!content) {
    return toolResultBlock;
  }

  // 跳过包含图片的结果
  if (Array.isArray(content) && content.some(b => b.type === 'image')) {
    return toolResultBlock;
  }

  // 计算内容大小
  const size = typeof content === 'string'
    ? content.length
    : JSON.stringify(content).length;

  // 检查是否需要持久化
  const threshold = Math.min(tool.maxResultSizeChars, DEFAULT_MAX_RESULT_SIZE_CHARS);
  if (size <= threshold || !Number.isFinite(threshold)) {
    return toolResultBlock;
  }

  // 持久化大结果
  const result = await persistToolResult(content, toolUseID, sessionId);
  if (isPersistError(result)) {
    // 持久化失败，返回原始结果
    return toolResultBlock;
  }

  const message = buildLargeToolResultMessage(result);

  return { ...toolResultBlock, content: message };
}
