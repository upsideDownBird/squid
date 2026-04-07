import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import type { Tool, ToolResult } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';

const WriteFileInputSchema = z.object({
  file_path: z.string(),
  content: z.string()
});

export const WriteFileTool: Tool<typeof WriteFileInputSchema, string> = {
  name: 'write_file',
  description:
    '写入文件内容。Plan 模式下通常仅允许写入工作区下的 .squid/plan*.md（以系统提示中的唯一路径为准）。',
  inputSchema: WriteFileInputSchema,
  maxResultSizeChars: 1000,

  async call(input, context): Promise<ToolResult<string>> {
    try {
      const filePath = join(context.workDir, input.file_path);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, input.content, 'utf-8');
      return { data: `File written: ${input.file_path}` };
    } catch (error) {
      return { data: '', error: (error as Error).message };
    }
  },

  mapToolResultToToolResultBlockParam(
    content: string,
    toolUseID: string
  ): ToolResultBlockParam {
    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: content || '(write_file completed with no output)',
    };
  },

  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  isDestructive: () => true
};

