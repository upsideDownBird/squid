import type { Tool, ToolResult, ToolContext } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';
import { cronManager } from './cron-manager';

const CronCreateInputSchema = z.object({
  cron_expression: z.string().describe('Cron 表达式，5个字段：分 时 日 月 星期。例如："33 22 * * *"表示每天22:33，"*/5 * * * *"表示每5分钟，"0 9 * * 1-5"表示工作日9点'),
  task_content: z.string().describe('任务内容描述，这个内容会在定时触发时作为 prompt 发送给 AI 执行')
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
  description: '创建定时任务。当用户要求"设置定时任务"、"定时执行"、"在某个时间执行"时使用此工具。需要将用户的时间描述转换为标准 cron 表达式（如 "33 22 * * *" 表示每天22:33，"*/5 * * * *" 表示每5分钟）。',
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
