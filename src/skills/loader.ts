import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { SkillDefinition, SkillYAML } from './schema';
import { SkillYAMLSchema } from './schema';

export class SkillLoader {
  private skillsDir: string;

  constructor(skillsDir?: string) {
    this.skillsDir = skillsDir || join(homedir(), '.jobopx', 'skills');
  }

  async loadSkill(filename: string): Promise<SkillDefinition> {
    const filePath = join(this.skillsDir, filename);
    const content = await readFile(filePath, 'utf-8');
    const parts = content.split('---\n');

    if (parts.length < 3) {
      throw new Error('Invalid skill file format');
    }

    const yamlContent = parts[1];
    const systemPrompt = parts.slice(2).join('---\n').trim();

    const metadata = SkillYAMLSchema.parse(this.parseYAML(yamlContent));

    return {
      metadata,
      systemPrompt
    };
  }

  private parseYAML(content: string): any {
    const lines = content.split('\n');
    const result: any = {};
    let currentKey = '';
    let currentArray: string[] = [];

    for (const line of lines) {
      if (line.includes(':')) {
        if (currentKey && currentArray.length > 0) {
          result[currentKey] = currentArray;
          currentArray = [];
        }
        const [key, value] = line.split(':').map(s => s.trim());
        currentKey = key;
        if (value) {
          if (value === 'true') {
            result[key] = true;
          } else if (value === 'false') {
            result[key] = false;
          } else {
            result[key] = value;
          }
        }
      } else if (line.trim().startsWith('-')) {
        currentArray.push(line.trim().substring(1).trim());
      }
    }

    if (currentKey && currentArray.length > 0) {
      result[currentKey] = currentArray;
    }

    return result;
  }

  async loadAll(): Promise<Map<string, SkillDefinition>> {
    const skills = new Map<string, SkillDefinition>();

    try {
      const files = await readdir(this.skillsDir);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const skill = await this.loadSkill(file);
          skills.set(skill.metadata.name, skill);
        }
      }
    } catch {
      // Skills directory doesn't exist yet
    }

    return skills;
  }
}
