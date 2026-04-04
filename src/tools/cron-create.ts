import type { Tool, ToolResult, ToolContext } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';
import { cronManager } from './cron-manager';

const CronCreateInputSchema = z.object({
  cron_expression: z.string().describe('Cron 表达式（如 "0 * * * *" 表示每小时）'),
  task_content: z.string().describe('任务内容描述')
});

type CronCreateInput = z.infer<typeof CronCreateInputSchema>;

interface CronCreateOutput {
  success: boolean;
  taskId?: string;
  expression?: string;
  content?: string;
  message: string;
}

export const CronCreateTool: Tool<typeof CronCreateInputSchema, CronCreateOutput> = {
  name: 'cron_create',
  description: '创建定时任务。使用 cron 表达式指定执行时间。',
  inputSchema: CronCreateInputSchema,
  maxResultSizeChars: 10000,

  async call(
    input: CronCreateInput,
    context: ToolContext
  ): Promise<ToolResult<CronCreateOutput>> {
    const result = cronManager.createTask(input.cron_expression, input.task_content);

    if (result.success) {
      return {
        data: {
          success: true,
          taskId: result.taskId,
          expression: input.cron_expression,
          content: input.task_content,
          message: `定时任务创建成功，任务 ID: ${result.taskId}`
        }
      };
    } else {
      return {
        data: {
          success: false,
          message: `定时任务创建失败: ${result.error}`
        },
        error: result.error
      };
    }
  },

  mapToolResultToToolResultBlockParam(
    content: CronCreateOutput,
    toolUseID: string
  ): ToolResultBlockParam {
    if (!content.success) {
      return {
        type: 'tool_result',
        tool_use_id: toolUseID,
        content: content.message,
        is_error: true
      };
    }

    let output = `✓ ${content.message}\n\n`;
    output += `表达式: ${content.expression}\n`;
    output += `内容: ${content.content}\n`;
    output += `任务 ID: ${content.taskId}`;

    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: output
    };
  },

  isConcurrencySafe: () => true,
  isReadOnly: () => false,
  isDestructive: () => false
};
