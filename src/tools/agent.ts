import type { Tool, ToolResult, ToolContext } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

const AgentInputSchema = z.object({
  instruction: z.string().describe('要执行的任务指令'),
  timeout: z.number().optional().describe('超时时间（毫秒），默认 300000（5分钟）')
});

type AgentInput = z.infer<typeof AgentInputSchema>;

interface AgentOutput {
  success: boolean;
  result?: string;
  instruction: string;
  duration?: number;
  error?: string;
}

export const AgentTool: Tool<typeof AgentInputSchema, AgentOutput> = {
  name: 'agent',
  description: '创建子代理执行复杂任务。子代理有独立的上下文和工具访问权限。',
  inputSchema: AgentInputSchema,
  maxResultSizeChars: 100000,

  async call(
    input: AgentInput,
    context: ToolContext
  ): Promise<ToolResult<AgentOutput>> {
    const startTime = Date.now();
    const timeout = input.timeout || 300000; // 默认 5 分钟

    // 检查 API 密钥
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        data: {
          success: false,
          instruction: input.instruction,
          error: '未配置 ANTHROPIC_API_KEY 环境变量'
        },
        error: 'API key not configured'
      };
    }

    try {
      // 创建一个简化的子代理
      // 注意：这是一个简化版本，实际应该创建完整的 TaskExecutor 实例
      const client = new Anthropic({ apiKey });

      // 使用 AbortController 实现超时
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, timeout);

      try {
        const response = await client.messages.create(
          {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4096,
            messages: [
              {
                role: 'user',
                content: `请执行以下任务:\n\n${input.instruction}\n\n请提供详细的执行结果。`
              }
            ]
          },
          {
            signal: abortController.signal
          }
        );

        clearTimeout(timeoutId);

        const result = response.content[0].type === 'text'
          ? response.content[0].text
          : '';

        const duration = Date.now() - startTime;

        return {
          data: {
            success: true,
            result,
            instruction: input.instruction,
            duration
          }
        };
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          return {
            data: {
              success: false,
              instruction: input.instruction,
              error: `子代理执行超时（${timeout}ms）`
            },
            error: 'Timeout'
          };
        }

        throw error;
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        data: {
          success: false,
          instruction: input.instruction,
          duration,
          error: `子代理执行失败: ${(error as Error).message}`
        },
        error: (error as Error).message
      };
    }
  },

  mapToolResultToToolResultBlockParam(
    content: AgentOutput,
    toolUseID: string
  ): ToolResultBlockParam {
    if (!content.success) {
      return {
        type: 'tool_result',
        tool_use_id: toolUseID,
        content: content.error || '子代理执行失败',
        is_error: true
      };
    }

    let output = `子代理任务: ${content.instruction}\n`;

    if (content.duration) {
      output += `执行时间: ${content.duration}ms\n`;
    }

    output += `\n结果:\n${content.result || ''}`;

    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: output
    };
  },

  isConcurrencySafe: () => false, // 子代理执行不应并发
  isReadOnly: () => false, // 子代理可能修改状态
  isDestructive: () => false // 取决于子代理执行的任务
};
