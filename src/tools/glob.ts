import { glob } from 'glob';
import type { Tool, ToolResult } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';

const GlobInputSchema = z.object({
  pattern: z.string(),
  path: z.string().optional()
});

export const GlobTool: Tool<typeof GlobInputSchema, string[]> = {
  name: 'glob',
  description: '文件名匹配搜索',
  inputSchema: GlobInputSchema,
  maxResultSizeChars: 50000,

  async call(input, context): Promise<ToolResult<string[]>> {
    try {
      const cwd = input.path || context.workDir;
      const files = await glob(input.pattern, { cwd });
      return { data: files };
    } catch (error) {
      return { data: [], error: (error as Error).message };
    }
  },

  mapToolResultToToolResultBlockParam(
    content: string[],
    toolUseID: string
  ): ToolResultBlockParam {
    if (!content || content.length === 0) {
      return {
        type: 'tool_result',
        tool_use_id: toolUseID,
        content: 'No files found',
      };
    }

    const formatted = `Found ${content.length} files:\n${content.join('\n')}`;

    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: formatted,
    };
  },

  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  isDestructive: () => false
};
