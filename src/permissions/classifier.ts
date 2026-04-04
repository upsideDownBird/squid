import type { PermissionResult } from './engine';

export type ToolClassification = 'safe' | 'risky' | 'destructive';

export interface ToolClassifier {
  classify(toolName: string, input: any): ToolClassification;
}

export const defaultClassifier: ToolClassifier = {
  classify(toolName: string, input: any): ToolClassification {
    const destructiveTools = ['write_file', 'delete_file', 'bash'];
    const riskyTools = ['http_request', 'execute_code'];

    if (destructiveTools.includes(toolName)) {
      return 'destructive';
    }
    if (riskyTools.includes(toolName)) {
      return 'risky';
    }
    return 'safe';
  }
};

export interface PermissionHook {
  name: string;
  execute(toolName: string, input: any): Promise<PermissionResult>;
}

export class PermissionHookRegistry {
  private hooks: Map<string, PermissionHook> = new Map();

  register(hook: PermissionHook) {
    this.hooks.set(hook.name, hook);
  }

  async executeAll(toolName: string, input: any): Promise<PermissionResult[]> {
    const results: PermissionResult[] = [];
    for (const hook of this.hooks.values()) {
      results.push(await hook.execute(toolName, input));
    }
    return results;
  }
}
