import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import type { z } from 'zod';

export interface ToolContext {
  workDir: string;
  taskId: string;
  mode: 'ask' | 'craft' | 'plan';
  abortSignal?: AbortSignal;
}

export interface ToolResult<T> {
  data: T;
  error?: string;
}

export interface ToolProgress<P = any> {
  toolUseID: string;
  data: P;
}

export type ToolCallProgress<P = any> = (progress: ToolProgress<P>) => void;

export type Tool<Input extends z.ZodType = z.ZodType, Output = unknown, P = any> = {
  name: string;
  description: string;
  inputSchema: Input;
  maxResultSizeChars: number;

  call(
    input: z.infer<Input>,
    context: ToolContext,
    onProgress?: ToolCallProgress<P>
  ): Promise<ToolResult<Output>>;

  mapToolResultToToolResultBlockParam(
    content: Output,
    toolUseID: string
  ): ToolResultBlockParam;

  isConcurrencySafe(input: z.infer<Input>): boolean;
  isReadOnly(input: z.infer<Input>): boolean;
  isDestructive?(input: z.infer<Input>): boolean;
};

export type Tools = Tool[];

/**
 * 默认的结果映射实现
 * 为未实现自定义映射的工具提供基础行为
 */
export function defaultMapToolResult<T>(
  toolName: string,
  content: T,
  toolUseID: string
): ToolResultBlockParam {
  if (!content) {
    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: `(${toolName} completed with no output)`,
    };
  }

  // 如果是字符串，直接返回
  if (typeof content === 'string') {
    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content,
    };
  }

  // 如果是对象，序列化为 JSON
  return {
    type: 'tool_result',
    tool_use_id: toolUseID,
    content: JSON.stringify(content, null, 2),
  };
}

