import type { Tool, ToolResult, ToolContext } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';
import { cronManager } from './cron-manager';

const CronDeleteInputSchema = z.object({
  task_id: z.string().describe('要删除的任务 ID')
});

type CronDeleteInput = z.infer<typeof CronDeleteInputSchema>;

interface CronDeleteOutput {
  success: boolean;
  taskId: string;
  message: string;
}

export const CronDeleteTool: Tool<typeof CronDeleteInputSchema, CronDeleteOutput> = {
  name: 'cron_delete',
  description: '删除指定的定时任务。',
  inputSchema: CronDeleteInputSchema,
  maxResultSizeChars: 10000,

  async call(
    input: CronDeleteInput,
    context: ToolContext
  ): Promise<ToolResult<CronDeleteOutput>> {
    const result = cronManager.deleteTask(input.task_id);

    if (result.success) {
      return {
        data: {
          success: true,
          taskId: input.task_id,
          message: `定时任务已删除: ${input.task_id}`
        }
      };
    } else {
      return {
        data: {
          success: false,
          taskId: input.task_id,
          message: `删除失败: ${result.error}`
        },
        error: result.error
      };
    }
  },

  mapToolResultToToolResultBlockParam(
    content: CronDeleteOutput,
    toolUseID: string
  ): ToolResultBlockParam {
    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: content.message,
      is_error: !content.success
    };
  },

  isConcurrencySafe: () => true,
  isReadOnly: () => false,
  isDestructive: () => true // 删除任务是破坏性操作
};
