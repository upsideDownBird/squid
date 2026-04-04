import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Tool, ToolResult } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';

const ReadFileInputSchema = z.object({
  file_path: z.string()
});

export const ReadFileTool: Tool<typeof ReadFileInputSchema, string> = {
  name: 'read_file',
  description: '读取文件内容',
  inputSchema: ReadFileInputSchema,
  maxResultSizeChars: Infinity, // 不限制大小，返回完整内容

  async call(input, context): Promise<ToolResult<string>> {
    try {
      const filePath = join(context.workDir, input.file_path);
      const content = await readFile(filePath, 'utf-8');
      return { data: content };
    } catch (error) {
      return { data: '', error: (error as Error).message };
    }
  },

  mapToolResultToToolResultBlockParam(
    content: string,
    toolUseID: string
  ): ToolResultBlockParam {
    if (!content || content.trim() === '') {
      return {
        type: 'tool_result',
        tool_use_id: toolUseID,
        content: '(read_file completed with no output)',
      };
    }

    // 返回完整内容，不截断
    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content,
    };
  },

  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  isDestructive: () => false
};

