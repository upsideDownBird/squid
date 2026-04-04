import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SkillTool } from '../tools/skill';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { ToolContext } from '../tools/base';

describe('SkillTool', () => {
  const testSkillsDir = join(homedir(), '.jobopx', 'skills');
  const mockContext: ToolContext = {
    workDir: process.cwd(),
    taskId: 'test-task',
    mode: 'craft'
  };

  beforeEach(async () => {
    await mkdir(testSkillsDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testSkillsDir, { recursive: true, force: true });
  });

  it('应该成功加载并调用技能', async () => {
    const skillContent = `---
name: test-skill
description: Test skill for testing
when-to-use: For testing purposes
allowed-tools:
  - read_file
  - write_file
effort: low
user-invocable: true
---

This is a test skill system prompt.
Execute the test task.`;

    await writeFile(join(testSkillsDir, 'test-skill.md'), skillContent);

    const result = await SkillTool.call(
      {
        skill_name: 'test-skill'
      },
      mockContext
    );

    expect(result.data.success).toBe(true);
    expect(result.data.skillName).toBe('test-skill');
    expect(result.data.result).toContain('test-skill');
    expect(result.data.result).toContain('Test skill for testing');
    expect(result.data.result).toContain('This is a test skill system prompt');
  });

  it('应该支持传递参数', async () => {
    const skillContent = `---
name: param-skill
description: Skill with parameters
when-to-use: When parameters are needed
allowed-tools:
  - read_file
effort: low
user-invocable: true
---

Skill with parameters.`;

    await writeFile(join(testSkillsDir, 'param-skill.md'), skillContent);

    const result = await SkillTool.call(
      {
        skill_name: 'param-skill',
        args: 'test arguments'
      },
      mockContext
    );

    expect(result.data.success).toBe(true);
    expect(result.data.result).toContain('参数: test arguments');
  });

  it('应该返回错误当技能不存在', async () => {
    const result = await SkillTool.call(
      {
        skill_name: 'nonexistent-skill'
      },
      mockContext
    );

    expect(result.data.success).toBe(false);
    expect(result.data.error).toContain('技能不存在');
  });

  it('应该拒绝不可调用的技能', async () => {
    const skillContent = `---
name: internal-skill
description: Internal skill
when-to-use: Internal use only
allowed-tools:
  - read_file
effort: low
user-invocable: false
---

Internal skill prompt.`;

    await writeFile(join(testSkillsDir, 'internal-skill.md'), skillContent);

    const result = await SkillTool.call(
      {
        skill_name: 'internal-skill'
      },
      mockContext
    );

    expect(result.data.success).toBe(false);
    expect(result.data.error).toContain('不可被直接调用');
  });

  it('mapToolResultToToolResultBlockParam 应该正确格式化输出', () => {
    const output = {
      success: true,
      skillName: 'test-skill',
      result: 'Skill execution result'
    };

    const result = SkillTool.mapToolResultToToolResultBlockParam(output, 'test-id');

    expect(result.type).toBe('tool_result');
    expect(result.tool_use_id).toBe('test-id');
    expect(result.content).toBe('Skill execution result');
  });

  it('mapToolResultToToolResultBlockParam 应该正确格式化错误', () => {
    const output = {
      success: false,
      skillName: 'test-skill',
      error: 'Skill not found'
    };

    const result = SkillTool.mapToolResultToToolResultBlockParam(output, 'test-id');

    expect(result.type).toBe('tool_result');
    expect(result.tool_use_id).toBe('test-id');
    expect(result.content).toBe('Skill not found');
    expect(result.is_error).toBe(true);
  });

  it('应该正确标记为只读操作', () => {
    expect(SkillTool.isConcurrencySafe()).toBe(true);
    expect(SkillTool.isReadOnly()).toBe(true);
    expect(SkillTool.isDestructive?.()).toBe(false);
  });
});
