import type { Tool, ToolResult, ToolContext } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';

const BriefInputSchema = z.object({
  content: z.string().describe('要生成摘要的内容'),
  prompt: z.string().optional().describe('自定义提示（可选）'),
  type: z.enum(['brief', 'detailed', 'bullet_points']).optional().describe('摘要类型')
});

type BriefInput = z.infer<typeof BriefInputSchema>;

interface BriefOutput {
  success: boolean;
  summary?: string;
  type: string;
  error?: string;
}

export const BriefTool: Tool<typeof BriefInputSchema, BriefOutput> = {
  name: 'brief',
  description: '生成内容摘要。支持简短摘要、详细摘要和要点列表。',
  inputSchema: BriefInputSchema,
  maxResultSizeChars: 50000,

  async call(
    input: BriefInput,
    context: ToolContext
  ): Promise<ToolResult<BriefOutput>> {
    const summaryType = input.type || 'brief';

    // 检查 API 密钥
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        data: {
          success: false,
          type: summaryType,
          error: '未配置 ANTHROPIC_API_KEY 环境变量'
        },
        error: 'API key not configured'
      };
    }

    try {
      // 截断内容以避免超过模型限制
      const maxContentLength = 50000;
      let content = input.content;
      if (content.length > maxContentLength) {
        content = content.substring(0, maxContentLength) + '\n\n[内容已截断...]';
      }

      // 构建提示
      let systemPrompt = '';
      switch (summaryType) {
        case 'brief':
          systemPrompt = '请用 2-3 句话简要概括以下内容的核心要点。';
          break;
        case 'detailed':
          systemPrompt = '请详细总结以下内容，包括主要观点、关键细节和结论。';
          break;
        case 'bullet_points':
          systemPrompt = '请用要点列表的形式总结以下内容，每个要点一行。';
          break;
      }

      if (input.prompt) {
        systemPrompt = input.prompt;
      }

      // 调用 Anthropic API
      const client = new Anthropic({ apiKey });

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n内容:\n${content}`
          }
        ]
      });

      const summary = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      return {
        data: {
          success: true,
          summary,
          type: summaryType
        }
      };
    } catch (error) {
      return {
        data: {
          success: false,
          type: summaryType,
          error: `摘要生成失败: ${(error as Error).message}`
        },
        error: (error as Error).message
      };
    }
  },

  mapToolResultToToolResultBlockParam(
    content: BriefOutput,
    toolUseID: string
  ): ToolResultBlockParam {
    if (!content.success) {
      return {
        type: 'tool_result',
        tool_use_id: toolUseID,
        content: content.error || '摘要生成失败',
        is_error: true
      };
    }

    let output = `摘要类型: ${content.type}\n\n`;
    output += content.summary || '';

    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: output
    };
  },

  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  isDestructive: () => false
};
