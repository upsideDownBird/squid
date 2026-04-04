import type { Tool, ToolResult, ToolContext } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';
import { cronManager, type CronTask } from './cron-manager';

const CronListInputSchema = z.object({});

type CronListInput = z.infer<typeof CronListInputSchema>;

interface CronListOutput {
  success: boolean;
  tasks: CronTask[];
  count: number;
}

export const CronListTool: Tool<typeof CronListInputSchema, CronListOutput> = {
  name: 'cron_list',
  description: '列出所有定时任务。',
  inputSchema: CronListInputSchema,
  maxResultSizeChars: 50000,

  async call(
    input: CronListInput,
    context: ToolContext
  ): Promise<ToolResult<CronListOutput>> {
    const tasks = cronManager.listTasks();

    return {
      data: {
        success: true,
        tasks,
        count: tasks.length
      }
    };
  },

  mapToolResultToToolResultBlockParam(
    content: CronListOutput,
    toolUseID: string
  ): ToolResultBlockParam {
    if (content.count === 0) {
      return {
        type: 'tool_result',
        tool_use_id: toolUseID,
        content: '当前没有定时任务'
      };
    }

    let output = `共有 ${content.count} 个定时任务:\n\n`;

    content.tasks.forEach((task, index) => {
      output += `${index + 1}. 任务 ID: ${task.id}\n`;
      output += `   表达式: ${task.expression}\n`;
      output += `   内容: ${task.content}\n`;
      output += `   创建时间: ${task.createdAt.toISOString()}\n`;

      if (task.lastRun) {
        output += `   上次运行: ${task.lastRun.toISOString()}\n`;
      }

      output += `   状态: ${task.isRunning ? '运行中' : '等待中'}\n\n`;
    });

    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: output.trim()
    };
  },

  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  isDestructive: () => false
};
