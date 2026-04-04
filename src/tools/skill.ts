import type { Tool, ToolResult, ToolContext } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';
import { SkillLoader } from '../skills/loader';

const SkillInputSchema = z.object({
  skill_name: z.string().describe('技能名称'),
  args: z.string().optional().describe('传递给技能的参数（可选）')
});

type SkillInput = z.infer<typeof SkillInputSchema>;

interface SkillOutput {
  success: boolean;
  skillName: string;
  result?: string;
  error?: string;
}

export const SkillTool: Tool<typeof SkillInputSchema, SkillOutput> = {
  name: 'skill',
  description: '调用已注册的技能。技能是预定义的任务模板，可以执行特定的操作。',
  inputSchema: SkillInputSchema,
  maxResultSizeChars: 100000,

  async call(
    input: SkillInput,
    context: ToolContext
  ): Promise<ToolResult<SkillOutput>> {
    try {
      const loader = new SkillLoader();

      // 尝试加载技能
      let skill;
      try {
        skill = await loader.loadSkill(`${input.skill_name}.md`);
      } catch (error) {
        return {
          data: {
            success: false,
            skillName: input.skill_name,
            error: `技能不存在: ${input.skill_name}`
          },
          error: `Skill not found: ${input.skill_name}`
        };
      }

      // 检查技能是否可被用户调用
      if (!skill.metadata['user-invocable']) {
        return {
          data: {
            success: false,
            skillName: input.skill_name,
            error: `技能 ${input.skill_name} 不可被直接调用`
          },
          error: 'Skill is not user-invocable'
        };
      }

      // 构建结果
      let result = `技能: ${skill.metadata.name}\n`;
      result += `描述: ${skill.metadata.description}\n`;
      result += `何时使用: ${skill.metadata['when-to-use']}\n\n`;
      result += `系统提示:\n${skill.systemPrompt}\n`;

      if (input.args) {
        result += `\n参数: ${input.args}`;
      }

      // 注意：这里只是返回技能信息
      // 实际执行技能需要集成到 TaskExecutor 中
      // 这是一个简化版本，主要用于展示技能内容

      return {
        data: {
          success: true,
          skillName: input.skill_name,
          result
        }
      };
    } catch (error) {
      return {
        data: {
          success: false,
          skillName: input.skill_name,
          error: `技能调用失败: ${(error as Error).message}`
        },
        error: (error as Error).message
      };
    }
  },

  mapToolResultToToolResultBlockParam(
    content: SkillOutput,
    toolUseID: string
  ): ToolResultBlockParam {
    if (!content.success) {
      return {
        type: 'tool_result',
        tool_use_id: toolUseID,
        content: content.error || '技能调用失败',
        is_error: true
      };
    }

    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: content.result || ''
    };
  },

  isConcurrencySafe: () => true,
  isReadOnly: () => true, // 读取技能信息是只读操作
  isDestructive: () => false
};
