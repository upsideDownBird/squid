import { describe, it, expect, beforeAll } from 'vitest';
import { WebFetchTool } from '../src/tools/web-fetch';
import type { ToolContext } from '../src/tools/base';

describe('WebFetchTool', () => {
  const context: ToolContext = {
    workDir: process.cwd(),
    taskId: 'test-task',
    mode: 'ask',
  };

  it('应该成功获取简单 HTML 页面', async () => {
    const result = await WebFetchTool.call(
      {
        url: 'https://example.com',
        prompt: 'Summarize the content',
      },
      context
    );

    expect(result.data).toBeDefined();
    expect(result.data.url).toBe('https://example.com');
    expect(result.data.code).toBe(200);
    expect(result.data.content).toBeTruthy();
    expect(result.data.content.length).toBeGreaterThan(0);
  }, 30000);

  it('应该正确转换 HTML 到 Markdown', async () => {
    const result = await WebFetchTool.call(
      {
        url: 'https://example.com',
        prompt: 'Get content',
      },
      context
    );

    expect(result.data).toBeDefined();
    // Markdown 应该包含文本内容，不应该有 HTML 标签
    expect(result.data.content).not.toContain('<html>');
    expect(result.data.content).not.toContain('<body>');
  }, 30000);

  it('应该使用缓存机制（重复请求相同 URL）', async () => {
    const url = 'https://example.com';

    // 第一次请求
    const result1 = await WebFetchTool.call(
      { url, prompt: 'test' },
      context
    );

    // 第二次请求（应该从缓存获取）
    const result2 = await WebFetchTool.call(
      { url, prompt: 'test' },
      context
    );

    // 内容应该完全相同
    expect(result2.data.content).toBe(result1.data.content);
    expect(result2.data.bytes).toBe(result1.data.bytes);
    // 第二次请求应该非常快（几乎为 0）
    expect(result2.data.durationMs).toBeLessThanOrEqual(10);
  }, 30000);

  it('应该处理 404 错误', async () => {
    const result = await WebFetchTool.call(
      {
        url: 'https://example.com/this-page-does-not-exist-404',
        prompt: 'test',
      },
      context
    );

    // 404 也会返回结果，但 code 应该是 404
    expect(result.data).toBeDefined();
    expect(result.data.code).toBe(404);
  }, 30000);

  it('应该处理无效 URL', async () => {
    const result = await WebFetchTool.call(
      {
        url: 'not-a-valid-url',
        prompt: 'test',
      },
      context
    );

    expect(result.error).toBeDefined();
    expect(result.error).toContain('Invalid URL');
  }, 30000);

  it('应该正确映射工具结果', () => {
    const output = {
      url: 'https://example.com',
      content: '# Test Content\n\nThis is a test.',
      bytes: 1024,
      code: 200,
      codeText: 'OK',
      contentType: 'text/html',
      durationMs: 500,
    };

    const mapped = WebFetchTool.mapToolResultToToolResultBlockParam(
      output,
      'tool-use-123'
    );

    expect(mapped.type).toBe('tool_result');
    expect(mapped.tool_use_id).toBe('tool-use-123');
    expect(typeof mapped.content).toBe('string');
    expect(mapped.content).toContain('https://example.com');
    expect(mapped.content).toContain('200 OK');
  });

  it('应该标记为并发安全和只读', () => {
    expect(WebFetchTool.isConcurrencySafe()).toBe(true);
    expect(WebFetchTool.isReadOnly()).toBe(true);
    expect(WebFetchTool.isDestructive?.()).toBe(false);
  });
});
