import { resolve, relative } from 'path';

export class WorkspaceSandbox {
  constructor(private workspaceRoot: string) {}

  async validatePath(filePath: string): Promise<void> {
    const resolvedPath = resolve(filePath);
    const relativePath = relative(this.workspaceRoot, resolvedPath);

    if (relativePath.startsWith('..') || resolve(relativePath).startsWith('..')) {
      throw new Error(`Path outside workspace: ${filePath}`);
    }
  }

  resolvePath(filePath: string): string {
    const resolvedPath = resolve(this.workspaceRoot, filePath);
    const relativePath = relative(this.workspaceRoot, resolvedPath);

    if (relativePath.startsWith('..')) {
      throw new Error(`Path outside workspace: ${filePath}`);
    }
    return resolvedPath;
  }
}
