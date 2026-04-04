import { access, mkdir } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export class WorkspaceManager {
  private workspacesDir: string;

  constructor() {
    this.workspacesDir = join(homedir(), '.jobopx', 'workspaces');
  }

  async init() {
    await mkdir(this.workspacesDir, { recursive: true });
  }

  async bindWorkDir(taskId: string, customPath?: string): Promise<string> {
    if (customPath) {
      await this.validatePath(customPath);
      return customPath;
    }

    const workDir = join(this.workspacesDir, taskId);
    await mkdir(workDir, { recursive: true });
    return workDir;
  }

  private async validatePath(path: string): Promise<void> {
    try {
      await access(path);
    } catch {
      throw new Error(`Path does not exist: ${path}`);
    }
  }
}
