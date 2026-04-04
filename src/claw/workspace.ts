import { mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export class ClawWorkspace {
  private readonly clawDir: string;

  constructor() {
    this.clawDir = join(homedir(), '.jobopx', 'claw');
  }

  async initialize(): Promise<void> {
    await mkdir(this.clawDir, { recursive: true });
  }

  getWorkDir(): string {
    return this.clawDir;
  }

  getTaskDir(taskId: string): string {
    return join(this.clawDir, taskId);
  }

  async createTaskDir(taskId: string): Promise<string> {
    const taskDir = this.getTaskDir(taskId);
    await mkdir(taskDir, { recursive: true });
    return taskDir;
  }
}
