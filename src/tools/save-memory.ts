// Save Memory Tool - Allow LLM to save important information to long-term memory
import { z } from 'zod';
import type { Tool, ToolContext, ToolResult } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { MemoryManager } from '../memory/manager';

const SaveMemoryInputSchema = z.object({
  type: z.enum(['user', 'feedback', 'project', 'reference']).describe('Memory type: user (user info), feedback (suggestions/preferences), project (project info), reference (reference materials)'),
  name: z.string().describe('Short name for this memory (e.g., "user_role", "preferred_style")'),
  description: z.string().describe('Brief description of what this memory contains'),
  content: z.string().describe('The actual content to remember')
});

type SaveMemoryInput = z.infer<typeof SaveMemoryInputSchema>;
type SaveMemoryOutput = { id: string; message: string };

export class SaveMemoryTool implements Tool<typeof SaveMemoryInputSchema, SaveMemoryOutput> {
  name = 'save_memory';
  description = 'Save important information to long-term memory. Use this when the user explicitly asks you to remember something (e.g., "记住...", "请记住...", "remember that..."). Choose the appropriate type: user (user preferences/info), feedback (suggestions on how to work), project (project-related info), reference (general reference materials).';
  inputSchema = SaveMemoryInputSchema;
  maxResultSizeChars = 1000;

  private memoryManager: MemoryManager;

  constructor() {
    this.memoryManager = new MemoryManager();
    this.memoryManager.init().catch(err => {
      console.error('Failed to initialize MemoryManager in SaveMemoryTool:', err);
    });
  }

  async call(
    input: SaveMemoryInput,
    context: ToolContext
  ): Promise<ToolResult<SaveMemoryOutput>> {
    try {
      // 验证输入参数
      if (!input || typeof input !== 'object') {
        throw new Error('Invalid input: expected an object');
      }

      if (!input.type || !input.name || !input.description || !input.content) {
        throw new Error(`Missing required fields. Received: ${JSON.stringify(input)}`);
      }

      // 确保所有字段都是字符串
      const type = String(input.type);
      const name = String(input.name);
      const description = String(input.description);
      const content = String(input.content);

      // Create memory
      const memory = await this.memoryManager.create({
        type: type as 'user' | 'feedback' | 'project' | 'reference',
        name: name,
        description: description,
        content: content
      });

      return {
        data: {
          id: memory.id,
          message: `Memory saved successfully with ID: ${memory.id}. Type: ${type}, Name: ${name}`
        }
      };
    } catch (error: any) {
      console.error('SaveMemoryTool error:', error);
      return {
        data: {
          id: '',
          message: ''
        },
        error: `Failed to save memory: ${error.message}`
      };
    }
  }

  mapToolResultToToolResultBlockParam(
    content: SaveMemoryOutput,
    toolUseID: string
  ): ToolResultBlockParam {
    if (!content || !content.message) {
      return {
        type: 'tool_result',
        tool_use_id: toolUseID,
        content: '(save_memory completed with no output)',
      };
    }

    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: content.message,
    };
  }

  isConcurrencySafe(input: SaveMemoryInput): boolean {
    return false; // Memory operations should be sequential
  }

  isReadOnly(input: SaveMemoryInput): boolean {
    return false; // This modifies the memory store
  }

  isDestructive(input: SaveMemoryInput): boolean {
    return false; // Creating memory is not destructive
  }
}

// Export singleton instance
export const saveMemoryTool = new SaveMemoryTool();
