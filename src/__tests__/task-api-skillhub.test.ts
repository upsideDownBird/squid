import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../skills/tencent-skillhub-client', () => {
  return {
    TencentSkillHubClient: vi.fn().mockImplementation(() => ({
      listSkills: vi.fn().mockResolvedValue([
        {
          slug: 'demo-skill',
          name: 'Demo Skill',
          description: 'desc',
          latestVersion: '1.0.0'
        }
      ])
    }))
  };
});

vi.mock('../skills/tencent-skillhub-metadata', () => {
  return {
    readTencentSkillHubLockfile: vi.fn().mockResolvedValue({
      version: 1,
      skills: {
        'demo-skill': {
          version: '0.9.0',
          installedAt: 1
        }
      }
    }),
    getTencentSkillHubInstallStatus: vi.fn().mockReturnValue({
      status: 'updatable',
      installedVersion: '0.9.0'
    })
  };
});

vi.mock('../skills/tencent-skillhub-installer', () => {
  return {
    installTencentSkillHubSkill: vi.fn().mockResolvedValue({
      success: true,
      slug: 'demo-skill',
      version: '1.0.0',
      targetDir: '/tmp/skills/demo-skill'
    })
  };
});

import { TaskAPI } from '../api/task-api';

describe('TaskAPI Tencent SkillHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该返回带安装状态的 SkillHub 列表', async () => {
    const api = new TaskAPI();
    const result = await api.listTencentSkillHubSkills('demo', 20);
    expect(result.success).toBe(true);
    expect(result.total).toBe(1);
    expect(result.skills[0]?.installStatus).toBe('updatable');
    expect(result.skills[0]?.installedVersion).toBe('0.9.0');
  });

  it('应该调用安装器执行一键安装', async () => {
    const api = new TaskAPI();
    const result = await api.installTencentSkillHubSkill({
      slug: 'demo-skill'
    });
    expect(result.success).toBe(true);
    expect(result.slug).toBe('demo-skill');
    expect(result.version).toBe('1.0.0');
  });
});
