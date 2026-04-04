import { spawn } from 'child_process';
import { platform } from 'os';
import type { Tool, ToolResult, ToolContext } from './base';
import type { ToolResultBlockParam } from '@anthropic-ai/sdk/resources/index.mjs';
import { z } from 'zod';

const PowerShellInputSchema = z.object({
  command: z.string().describe('要执行的 PowerShell 命令'),
  working_directory: z.string().optional().describe('工作目录（可选）'),
  timeout: z.number().optional().describe('超时时间（毫秒），默认 30000'),
  run_in_background: z.boolean().optional().describe('是否在后台运行')
});

type PowerShellInput = z.infer<typeof PowerShellInputSchema>;

interface PowerShellOutput {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  command: string;
  taskId?: string;
  platform?: string;
}

// 后台任务管理器
const backgroundTasks = new Map<string, { process: any; output: PowerShellOutput }>();

export const PowerShellTool: Tool<typeof PowerShellInputSchema, PowerShellOutput> = {
  name: 'powershell',
  description: '执行 PowerShell 命令（仅限 Windows 平台）。支持超时控制和后台运行。',
  inputSchema: PowerShellInputSchema,
  maxResultSizeChars: 50000,

  async call(
    input: PowerShellInput,
    context: ToolContext
  ): Promise<ToolResult<PowerShellOutput>> {
    // 检查平台
    const currentPlatform = platform();
    if (currentPlatform !== 'win32') {
      return {
        data: {
          success: false,
          stdout: '',
          stderr: `PowerShell 仅在 Windows 平台可用，当前平台: ${currentPlatform}`,
          exitCode: null,
          command: input.command,
          platform: currentPlatform
        },
        error: 'Platform not supported'
      };
    }

    const timeout = input.timeout || 30000;
    const workDir = input.working_directory || context.workDir;

    // 如果是后台运行
    if (input.run_in_background) {
      const taskId = `ps-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const output: PowerShellOutput = {
        success: true,
        stdout: '',
        stderr: '',
        exitCode: null,
        command: input.command,
        taskId,
        platform: currentPlatform
      };

      const childProcess = spawn('powershell.exe', ['-Command', input.command], {
        cwd: workDir
      });

      childProcess.stdout?.on('data', (data) => {
        output.stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data) => {
        output.stderr += data.toString();
      });

      childProcess.on('exit', (code) => {
        output.exitCode = code;
        output.success = code === 0;
      });

      backgroundTasks.set(taskId, { process: childProcess, output });

      return {
        data: {
          success: true,
          stdout: `后台任务已启动，任务 ID: ${taskId}`,
          stderr: '',
          exitCode: null,
          command: input.command,
          taskId,
          platform: currentPlatform
        }
      };
    }

    // 前台执行
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const childProcess = spawn('powershell.exe', ['-Command', input.command], {
        cwd: workDir
      });

      // 设置超时
      const timeoutId = setTimeout(() => {
        timedOut = true;
        childProcess.kill('SIGTERM');

        setTimeout(() => {
          if (!childProcess.killed) {
            childProcess.kill('SIGKILL');
          }
        }, 5000);
      }, timeout);

      childProcess.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      childProcess.on('exit', (code) => {
        clearTimeout(timeoutId);

        if (timedOut) {
          resolve({
            data: {
              success: false,
              stdout,
              stderr: stderr + `\n命令执行超时（${timeout}ms）`,
              exitCode: null,
              command: input.command,
              platform: currentPlatform
            }
          });
        } else {
          resolve({
            data: {
              success: code === 0,
              stdout,
              stderr,
              exitCode: code,
              command: input.command,
              platform: currentPlatform
            }
          });
        }
      });

      childProcess.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          data: {
            success: false,
            stdout,
            stderr: error.message,
            exitCode: null,
            command: input.command,
            platform: currentPlatform
          },
          error: error.message
        });
      });
    });
  },

  mapToolResultToToolResultBlockParam(
    content: PowerShellOutput,
    toolUseID: string
  ): ToolResultBlockParam {
    let output = `Command: ${content.command}\n`;

    if (content.platform) {
      output += `Platform: ${content.platform}\n`;
    }

    if (content.taskId) {
      output += `Task ID: ${content.taskId}\n`;
    }

    if (content.exitCode !== null) {
      output += `Exit Code: ${content.exitCode}\n`;
    }

    if (content.stdout) {
      output += `\nStdout:\n${content.stdout}`;
    }

    if (content.stderr) {
      output += `\nStderr:\n${content.stderr}`;
    }

    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: output.trim(),
      is_error: !content.success
    };
  },

  isConcurrencySafe: () => true,
  isReadOnly: () => false,
  isDestructive: () => true
};

export { backgroundTasks };
