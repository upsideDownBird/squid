import type { SkillDefinition } from './schema';
import type { Tool } from '../tools/base';

export class SkillValidator {
  validateToolAccess(skill: SkillDefinition, toolName: string): boolean {
    return skill.metadata['allowed-tools'].includes(toolName) ||
           skill.metadata['allowed-tools'].includes('*');
  }

  filterTools(skill: SkillDefinition, allTools: Tool[]): Tool[] {
    if (skill.metadata['allowed-tools'].includes('*')) {
      return allTools;
    }

    return allTools.filter(tool =>
      skill.metadata['allowed-tools'].includes(tool.name)
    );
  }

  validateSkill(skill: SkillDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!skill.metadata.name) {
      errors.push('Skill name is required');
    }

    if (!skill.metadata.description) {
      errors.push('Skill description is required');
    }

    if (!skill.systemPrompt) {
      errors.push('System prompt is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
