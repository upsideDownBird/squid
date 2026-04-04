export interface PermissionRule {
  id: string;
  tool: string;
  action: 'allow' | 'deny' | 'prompt';
  condition?: (input: any) => boolean;
  priority: number;
}

export interface PermissionResult {
  allowed: boolean;
  requiresPrompt: boolean;
  reason?: string;
}

export class PermissionEngine {
  private rules: PermissionRule[] = [];

  addRule(rule: PermissionRule) {
    this.rules.push(rule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  check(toolName: string, input: any): PermissionResult {
    for (const rule of this.rules) {
      if (rule.tool === toolName || rule.tool === '*') {
        if (rule.condition && !rule.condition(input)) continue;

        if (rule.action === 'deny') {
          return { allowed: false, requiresPrompt: false, reason: `Denied by rule ${rule.id}` };
        }
        if (rule.action === 'prompt') {
          return { allowed: false, requiresPrompt: true };
        }
        if (rule.action === 'allow') {
          return { allowed: true, requiresPrompt: false };
        }
      }
    }

    return { allowed: false, requiresPrompt: true };
  }
}
