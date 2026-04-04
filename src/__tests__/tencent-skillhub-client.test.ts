import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TencentSkillHubClient } from '../skills/tencent-skillhub-client';

describe('TencentSkillHubClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('应该通过 index 正确解析技能列表', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: () => 'application/json'
      },
      text: async () => JSON.stringify({
        skills: [
          {
            slug: 'demo-skill',
            name: 'Demo Skill',
            description: 'Demo description',
            latestVersion: '1.2.3'
          }
        ]
      })
    } as any));

    const client = new TencentSkillHubClient({
      baseUrl: 'https://example.com/api/v1',
      indexUrl: 'https://example.com/skills.json'
    });
    const result = await client.listSkills({ limit: 10 });
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('demo-skill');
    expect(result[0]?.latestVersion).toBe('1.2.3');
  });

  it('应该优先使用 search 接口查询技能', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: () => 'application/json'
      },
      text: async () => JSON.stringify({
        results: [
          {
            slug: 'search-skill',
            displayName: 'Search Skill',
            summary: 'Search from remote',
            version: '2.0.0'
          }
        ]
      })
    } as any));

    const client = new TencentSkillHubClient({
      baseUrl: 'https://example.com/api/v1',
      searchUrl: 'https://example.com/api/v1/search'
    });
    const result = await client.listSkills({ query: 'search', limit: 5 });
    expect(result).toHaveLength(1);
    expect(result[0]?.slug).toBe('search-skill');
    expect(result[0]?.name).toBe('Search Skill');
    expect(result[0]?.latestVersion).toBe('2.0.0');
  });

  it('应该在下载返回文本时包装为 SKILL.md', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: () => 'text/plain'
      },
      text: async () => '# skill content'
    } as any));

    const client = new TencentSkillHubClient({ baseUrl: 'https://example.com/api' });
    const pkg = await client.downloadSkillPackage('demo-skill', '1.0.0');
    expect(pkg.files['SKILL.md']).toContain('skill content');
  });

  it('应该在 index 接口异常时抛出错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: {
        get: () => 'application/json'
      },
      text: async () => '{"error":"server error"}'
    } as any));

    const client = new TencentSkillHubClient({
      baseUrl: 'https://example.com/api/v1',
      indexUrl: 'https://example.com/skills.json'
    });
    await expect(client.listSkills({})).rejects.toThrow('Tencent SkillHub index failed');
  });

  it('应该在 index 返回 HTML 时给出配置提示错误', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (key: string) => key === 'content-type' ? 'text/html' : ''
      },
      text: async () => '<!DOCTYPE html><html><head><title>SkillHub</title></head><body>...</body></html>'
    } as any));

    const client = new TencentSkillHubClient({
      baseUrl: 'https://example.com/api/v1',
      indexUrl: 'https://example.com/skills.json'
    });
    await expect(client.listSkills({})).rejects.toThrow('腾讯 SkillHub 返回了 HTML 页面');
  });
});
