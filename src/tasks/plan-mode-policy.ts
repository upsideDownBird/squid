import path from 'path';
import type { TaskMode } from './types';
import type { ToolRegistry } from '../tools/registry';
import type { Tool } from '../tools/base';

/** Plan 下始终可用的只读类工具 */
export const PLAN_MODE_READONLY_TOOL_NAMES = new Set<string>([
  'read_file',
  'glob',
  'grep',
  'web_fetch',
  'web_search',
  'brief',
  'cron_list',
]);

/** 仅允许指向 canonical 计划文件路径时执行 */
export const PLAN_MODE_PLAN_WRITE_TOOL_NAMES = new Set<string>(['file_edit', 'write_file']);

/** 下发给模型的 Plan 工具并集 */
export const PLAN_MODE_ALLOWED_TOOL_NAMES = new Set<string>([
  ...PLAN_MODE_READONLY_TOOL_NAMES,
  ...PLAN_MODE_PLAN_WRITE_TOOL_NAMES,
]);

export function sanitizeConversationIdForFilename(id: string): string {
  const s = id.trim().replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 64);
  return s || 'default';
}

/**
 * 当前会话在工作区内的 canonical 计划文件绝对路径。
 * 有 conversationId 时用 `.squid/plan-<sanitized>.md`，否则 `.squid/plan.md`。
 */
export function getCanonicalPlanFilePath(workspace: string, conversationId?: string): string {
  const root = path.resolve(workspace);
  const rel =
    conversationId?.trim().length ?? 0
      ? path.join('.squid', `plan-${sanitizeConversationIdForFilename(conversationId!)}.md`)
      : path.join('.squid', 'plan.md');
  return path.resolve(root, rel);
}

/** 传给 write_file / file_edit 的 file_path 应与该相对路径一致（相对当前工作区） */
export function getCanonicalPlanFileRelativePath(workspace: string, conversationId?: string): string {
  const canonical = getCanonicalPlanFilePath(workspace, conversationId);
  return path.relative(workspace, canonical) || '.';
}

function pathsEqualResolved(a: string, b: string): boolean {
  const na = path.normalize(a);
  const nb = path.normalize(b);
  if (process.platform === 'win32') {
    return na.toLowerCase() === nb.toLowerCase();
  }
  return na === nb;
}

/** 解析用户传入的 file_path（相对 workspace），与工具内 join(workDir, file_path) 一致 */
export function resolveToolFilePath(workspace: string, filePath: string): string {
  return path.resolve(workspace, filePath);
}

/** 目标路径必须在 workspace 根之下（防 .. 逃出） */
export function isPathInsideWorkspace(workspace: string, absoluteTarget: string): boolean {
  const root = path.resolve(workspace);
  const target = path.resolve(absoluteTarget);
  const rel = path.relative(root, target);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

export function getPlanModeSystemAppendix(workspace: string, conversationId?: string): string {
  const planPath = getCanonicalPlanFilePath(workspace, conversationId);
  const planRel = getCanonicalPlanFileRelativePath(workspace, conversationId);
  return `

# Plan 模式（当前任务）

你处于 **规划阶段**。请严格按以下顺序行动：

1. **（如需）** 使用只读工具（read_file、grep、glob、web_fetch、web_search 等）理解需求与代码库。
2. **必须** 在本轮中通过 \`write_file\`（新建）或 \`file_edit\`（文件已存在时）把**本轮方案**写入计划文件。
3. **禁止**在尚未把本轮方案写入计划文件之前，对**其它任意路径**调用 \`write_file\` 或 \`file_edit\`（例如业务源码、hello.py 等）。

**唯一允许的写入目标** — 工具参数 \`file_path\` 必须使用与工作区一致的**相对路径**（勿仅凭绝对路径心理模型，调用时仍填相对路径）:
\`${planRel}\`

**同一文件的绝对路径（便于对照）:** \`${planPath}\`

计划正文请用 Markdown，建议包含：步骤、拟创建或修改的文件路径、风险、验证方式。不要编辑工作区内其它文件。

**禁止** Shell/PowerShell、创建/删除定时任务、子 Agent / 技能、长期记忆写入等非只读操作。

需要实际创建业务文件或执行命令时，请让用户将模式切换为 **Ask** 或 **Craft**。`;
}

export function getToolsForTaskMode(mode: TaskMode, registry: ToolRegistry): Tool[] {
  const all = registry.getAll();
  if (mode !== 'plan') {
    return all;
  }
  return all.filter((t) => PLAN_MODE_ALLOWED_TOOL_NAMES.has(t.name));
}

export type PlanModeInvocationResult =
  | { ok: true }
  | { ok: false; message: string };

export function checkPlanModeToolInvocation(
  toolName: string,
  args: Record<string, unknown>,
  workspace: string,
  conversationId?: string
): PlanModeInvocationResult {
  if (!PLAN_MODE_ALLOWED_TOOL_NAMES.has(toolName)) {
    return {
      ok: false,
      message:
        `[Plan 模式] 不允许调用工具「${toolName}」。` +
        '请使用只读工具或仅写入计划文件；改业务代码请切换 Ask/Craft。',
    };
  }

  if (PLAN_MODE_READONLY_TOOL_NAMES.has(toolName)) {
    return { ok: true };
  }

  if (PLAN_MODE_PLAN_WRITE_TOOL_NAMES.has(toolName)) {
    const fp = args.file_path;
    if (typeof fp !== 'string' || !fp.trim()) {
      return {
        ok: false,
        message: '[Plan 模式] write_file / file_edit 必须提供有效的 file_path。',
      };
    }
    const canonical = getCanonicalPlanFilePath(workspace, conversationId);
    const resolved = resolveToolFilePath(workspace, fp);
    if (!isPathInsideWorkspace(workspace, resolved)) {
      return {
        ok: false,
        message: `[Plan 模式] 路径越出工作区，已拒绝：${fp}`,
      };
    }
    if (!pathsEqualResolved(resolved, canonical)) {
      const allowedRel = getCanonicalPlanFileRelativePath(workspace, conversationId);
      return {
        ok: false,
        message:
          `[Plan 模式] 仅允许写入计划文件。\n允许路径（请使用与此一致的相对路径）: ` +
          `${allowedRel}\n` +
          `绝对路径: ${canonical}\n\n` +
          '下一步：请立即使用 write_file（或文件已存在时用 file_edit），将 file_path 设为上述「允许路径」中的相对路径，写入或更新 Markdown 计划（步骤、拟创建文件、验证方式）。' +
          '实际创建业务源码等请让用户切换 Ask 或 Craft。',
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    message: `[Plan 模式] 工具「${toolName}」未配置为可用。`,
  };
}

/** @deprecated 使用 checkPlanModeToolInvocation */
export function isToolInvocationAllowedInPlanMode(
  toolName: string,
  args: Record<string, unknown>,
  workspace: string,
  conversationId?: string
): boolean {
  return checkPlanModeToolInvocation(toolName, args, workspace, conversationId).ok;
}

export function planModeToolRejectionMessage(toolName: string): string {
  return (
    `[Plan 模式] 当前任务处于规划阶段，不允许调用工具「${toolName}」。` +
    '请使用只读工具或仅写入计划文件；需要改业务代码时，请让用户将模式切换为 Ask 或 Craft。'
  );
}
