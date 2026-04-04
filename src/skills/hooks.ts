import { exec } from 'child_process';
import { promisify } from 'util';
import type { SkillDefinition } from './schema';

const execAsync = promisify(exec);

export class SkillHookExecutor {
  async executePreInvoke(skill: SkillDefinition): Promise<void> {
    const hook = skill.metadata.hooks?.pre_invoke;
    if (!hook) return;

    try {
      await execAsync(hook);
    } catch (error) {
      throw new Error(`Pre-invoke hook failed: ${(error as Error).message}`);
    }
  }

  async executePostInvoke(skill: SkillDefinition): Promise<void> {
    const hook = skill.metadata.hooks?.post_invoke;
    if (!hook) return;

    try {
      await execAsync(hook);
    } catch (error) {
      console.error(`Post-invoke hook failed: ${(error as Error).message}`);
    }
  }
}
