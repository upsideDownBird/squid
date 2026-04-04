import { describe, it, expect, beforeEach } from 'vitest';
import { PowerShellTool, backgroundTasks } from '../tools/powershell';
import { platform } from 'os';
import type { ToolContext } from '../tools/base';

describe('PowerShellTool', () => {
  const mockContext: ToolContext = {
    workDir: process.cwd(),
    taskId: 'test-task',
    mode: 'craft'
  };

  const isWindows = platform() === 'win32';

  beforeEach(() => {
    backgroundTasks.clear();
  });

  it('应该在非 Windows 平台返回错误', async () => {
    if (isWindows) {
      // 在 Windows 上跳过此测试
      return;
    }

    const result = await PowerShellTool.call(
      {
        command: 'Write-Host "Hello"'
      },
      mockContext
    );

    expect(result.data.success).toBe(false);
    expect(result.data.stderr).toContain('仅在 Windows 平台可用');
    expect(result.data.platform).toBe(platform());
  });

  it('应该在 Windows 平台成功执行命令', async () => {
    if (!isWindows) {
      // 在非 Windows 上跳过此测试
      return;
    }

    const result = await PowerShellTool.call(
      {
        command: 'Write-Host "Hello World"'
      },
      mockContext
    );

    expect(result.data.success).toBe(true);
    expect(result.data.stdout.trim()).toBe('Hello World');
    expect(result.data.exitCode).toBe(0);
  });

  it('应该在 Windows 平台捕获命令失败', async () => {
    if (!isWindows) {
      return;
    }

    const result = await PowerShellTool.call(
      {
        command: 'exit 1'
      },
      mockContext
    );

    expect(result.data.success).toBe(false);
    expect(result.data.exitCode).toBe(1);
  });

  it('应该支持后台执行', async () => {
    if (!isWindows) {
      return;
    }

    const result = await PowerShellTool.call(
      {
        command: 'Write-Host "background"',
        run_in_background: true
      },
      mockContext
    );

    expect(result.data.success).toBe(true);
    expect(result.data.taskId).toBeDefined();
    expect(result.data.stdout).toContain('后台任务已启动');
    expect(backgroundTasks.has(result.data.taskId!)).toBe(true);
  });

  it('mapToolResultToToolResultBlockParam 应该正确格式化输出', () => {
    const output = {
      success: true,
      stdout: 'Hello World',
      stderr: '',
      exitCode: 0,
      command: 'Write-Host "Hello"',
      platform: 'win32'
    };

    const result = PowerShellTool.mapToolResultToToolResultBlockParam(output, 'test-id');

    expect(result.type).toBe('tool_result');
    expect(result.tool_use_id).toBe('test-id');
    expect(result.content).toContain('Command: Write-Host "Hello"');
    expect(result.content).toContain('Platform: win32');
    expect(result.content).toContain('Exit Code: 0');
  });

  it('应该正确标记为破坏性操作', () => {
    expect(PowerShellTool.isConcurrencySafe()).toBe(true);
    expect(PowerShellTool.isReadOnly()).toBe(false);
    expect(PowerShellTool.isDestructive?.()).toBe(true);
  });
});
