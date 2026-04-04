import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentTool } from '../tools/agent';
import type { ToolContext } from '../tools/base';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn()
      }
    }))
  };
});

describe('AgentTool', () => {
  const mockContext: ToolContext = {
    workDir: process.cwd(),
    taskId: 'test-task',
    mode: 'craft'
  };

  const originalEnv = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.ANTHROPIC_API_KEY = originalEnv;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }
  });

  it('应该返回错误当未配置 API 密钥', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const result = await AgentTool.call(
      {
        instruction: 'Test task'
      },
      mockContext
    );

    expect(result.data.success).toBe(false);
    expect(result.data.error).toContain('未配置');
  });

  it('应该成功执行子代理任务', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Task completed successfully' }]
    });

    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: { create: mockCreate }
    }) as any);

    const result = await AgentTool.call(
      {
        instruction: 'Analyze the code'
      },
      mockContext
    );

    expect(result.data.success).toBe(true);
    expect(result.data.result).toBe('Task completed successfully');
    expect(result.data.instruction).toBe('Analyze the code');
    expect(result.data.duration).toBeGreaterThanOrEqual(0);
    expect(mockCreate).toHaveBeenCalled();
  });

  it('应该支持自定义超时', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const Anthropic = (await import('@anthropic-ai/sdk')).default;

    // Mock 一个会被 abort 的 Promise
    const mockCreate = vi.fn().mockImplementation((params, options) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve({
            content: [{ type: 'text', text: 'Result' }]
          });
        }, 1000);

        // 监听 abort 信号
        if (options?.signal) {
          options.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            const error = new Error('Request aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }
      });
    });

    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: { create: mockCreate }
    }) as any);

    const result = await AgentTool.call(
      {
        instruction: 'Quick task',
        timeout: 100
      },
      mockContext
    );

    // 应该超时
    expect(result.data.success).toBe(false);
    expect(result.data.error).toContain('超时');
  }, 10000);

  it('应该处理 API 错误', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));

    vi.mocked(Anthropic).mockImplementation(() => ({
      messages: { create: mockCreate }
    }) as any);

    const result = await AgentTool.call(
      {
        instruction: 'Test task'
      },
      mockContext
    );

    expect(result.data.success).toBe(false);
    expect(result.data.error).toContain('API Error');
  });

  it('mapToolResultToToolResultBlockParam 应该正确格式化输出', () => {
    const output = {
      success: true,
      result: 'Task completed',
      instruction: 'Test instruction',
      duration: 1500
    };

    const result = AgentTool.mapToolResultToToolResultBlockParam(output, 'test-id');

    expect(result.type).toBe('tool_result');
    expect(result.tool_use_id).toBe('test-id');
    expect(result.content).toContain('子代理任务: Test instruction');
    expect(result.content).toContain('执行时间: 1500ms');
    expect(result.content).toContain('Task completed');
  });

  it('mapToolResultToToolResultBlockParam 应该正确格式化错误', () => {
    const output = {
      success: false,
      instruction: 'Test instruction',
      error: 'Execution failed'
    };

    const result = AgentTool.mapToolResultToToolResultBlockParam(output, 'test-id');

    expect(result.type).toBe('tool_result');
    expect(result.tool_use_id).toBe('test-id');
    expect(result.content).toBe('Execution failed');
    expect(result.is_error).toBe(true);
  });

  it('应该正确标记工具属性', () => {
    expect(AgentTool.isConcurrencySafe()).toBe(false);
    expect(AgentTool.isReadOnly()).toBe(false);
    expect(AgentTool.isDestructive?.()).toBe(false);
  });
});
