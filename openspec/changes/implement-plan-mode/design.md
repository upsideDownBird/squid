## Context

- `TaskMode` 已包含 `'plan'`（`src/tasks/types.ts`），UI 已有 Plan 选项，但 `TaskExecutor` 中 `tools = toolRegistry.getAll()`，且 `tool.call(..., { mode: 'ask' })` 写死。
- 工具基类已有 `ToolContext.mode: 'ask' | 'craft' | 'plan'`（`src/tools/base.ts`），多数工具提供 `isReadOnly()`，但 Plan 模式不能仅依赖「事后拒绝」，应在 **下发给模型的 tools 定义** 上收敛，减少无效 ReAct。

## Goals / Non-Goals

**Goals**

- M1：Plan 模式下模型 **API 可见工具** 与 **实际可执行工具** 一致为只读子集（+ M2 的计划路径写）；系统说明明确结束条件（用户切换模式；M2 增加「写入计划文件」）。
- M2：计划文件落在 **用户 workspace**，路径安全（防目录穿越），创建 `.squid` 目录若需要。
- M3：计划内 **结构化并行任务** 可被解析，并能在执行阶段触发多路子任务（并发上限可配置），结果可汇总回主会话或日志。

**Non-Goals**

- 不实现 Claude Code 的 `EnterPlanMode`/`ExitPlanMode` 弹窗、`plan_mode` attachment 节流、CCR **Ultraplan**。
- M3 首期不要求自动 git merge / 自动 PR。

## Decisions

### Decision 1：Plan 工具策略 = 显式白名单 + 执行前闸

- **方案**：维护 `PLAN_MODE_ALLOWED_TOOL_NAMES`（或按工具名集合），M2 对 `write_file`/`file_edit` 额外用 **参数路径** 判断；`getToolsForTaskMode('plan')` 从 registry 过滤。
- **原因**：与「仅依赖 `isReadOnly()`」相比，避免 `save_memory` 等依赖 input 的工具歧义；与「完全隐藏写工具」相比，M2 可放行单一路径。
- **备选**：动态从 `tool.isReadOnly(defaultInput)` 推断 — 实现快但易漏或误判。

### Decision 2：计划文件路径

- **方案（默认）**：`<workspace>/.squid/plan.md`。若需多会话并行同一 workspace，可选用 `plan-<conversationShortId>.md`，由 `task-api` 传入或从会话 ID 派生，**实现时在 tasks 中定稿一种**。
- **原因**：用户要求计划落在工作空间；`.squid` 与现有配置命名习惯一致。
- **校验**：`path.resolve(workspace, userPath)` 后要求 `resolved === canonicalPlanPath` 或 `resolved.startsWith(workspace + sep)` 且 basename 在允许集合内（推荐严格等于 canonical，减少误写）。

### Decision 3：`ask` / `craft` 行为兼容

- **方案**：非 `plan` 时工具列表与当前生产一致（`getAll()` 经现有 deny/REPL 等逻辑若已有则保留）。
- **原因**：降低回归面。

### Decision 4：M3 并行格式与执行

- **方案**：在 `design` 层先选一种可解析格式（例如 Markdown `## Parallel tasks` 下 YAML 列表或固定 `- id: / prompt:`）；解析器纯函数 `parseParallelTracks`；执行层优先复用现有 `agent` 工具多次调用，`Promise.all` 限流（如 `p-limit` 或手写 semaphore），子任务 prompt 强制 **文件/目录边界**。
- **备选**：独立 Job 队列 + worker 进程 — 复杂度高，不作为 M3 首选。

## Risks / Trade-offs

- **漏登记工具名**：新型工具注册后若未更新白名单，plan 下不可用（偏安全）；Mitigation：单测枚举 registry 与 policy 差异或 CI 检查。
- **M3 同 workspace 并行写冲突**：Mitigation：并发上限、子目录 sandbox、计划模板要求声明 touch 路径。
- **用户将 `.squid/plan.md` 提交仓库**：产品提示可选 `.gitignore`。

## Migration Plan

1. 实施 M1 并发布；手工验证 Plan 与 Craft 切换。
2. 实施 M2；补充路径与安全单测。
3. 按需实施 M3；先解析与单测，再接线 agent/任务 API。

## Open Questions

- 计划文件固定名 `plan.md` 还是会话后缀名（多标签并发）？
- M3 并行块格式最终选 Markdown 还是 YAML front matter？
