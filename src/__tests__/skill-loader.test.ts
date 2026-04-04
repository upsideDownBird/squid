import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SkillLoader } from '../skills/loader';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';

describe('SkillLoader', () => {
  const testDir = '/tmp/test-skills';
  let loader: SkillLoader;

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
    loader = new SkillLoader(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should load skill from markdown file', async () => {
    const skillContent = `---
name: test-skill
description: Test skill
when-to-use: For testing
allowed-tools:
  - read_file
effort: low
user-invocable: true
---

Test system prompt`;

    await writeFile(join(testDir, 'test-skill.md'), skillContent);
    const skill = await loader.loadSkill('test-skill.md');

    expect(skill.metadata.name).toBe('test-skill');
    expect(skill.metadata.description).toBe('Test skill');
    expect(skill.systemPrompt).toBe('Test system prompt');
    expect(skill.metadata['allowed-tools']).toContain('read_file');
  });

  it('should throw error for invalid format', async () => {
    await writeFile(join(testDir, 'invalid.md'), 'No frontmatter');
    await expect(loader.loadSkill('invalid.md')).rejects.toThrow();
  });
});
