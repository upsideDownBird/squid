## Why

`squid` 已在 `TaskMode` 与 UI 中声明 `plan`，但 `TaskExecutor` 未按模式过滤工具、未注入规划期系统说明，且 `tool.call` 的 `ToolContext.mode` 被写死为 `ask`。结果是「Plan」与 Ask/Craft 行为几乎无差异，模型仍可调用写文件、Shell、cron 等工具，无法实现「先调研与出方案、再经用户切换模式后落地」的产品闭环。

参考 `claude-code-main` 的思路：规划期应同时依赖 **提示（软约束）** 与 **工具/API 契约（硬约束）**，必要时配合 **工作区内计划文件** 作为唯一写出口；若需并行落地，再引入 **多 Agent 编排**。

## What Changes

### M1（最小可用）

- 将 `request.mode` 贯通至 `buildMessages`、OpenAI/流式工具列表组装与每次 `tool.call` 的 `ToolContext`。
- `mode === 'plan'` 时：注入固定中文规划期系统说明；仅向模型暴露 **Plan 工具白名单**（只读工具等）；对非白名单工具调用在执行前拒绝并返回明确 tool 错误信息。
- 补充单元测试（白名单、执行闸、回归 ask/craft）。

### M2（工作区内计划文件）

- 约定计划文件路径位于 **当前 workspace** 下（默认 `<workspace>/.squid/plan.md`，实现时可选用会话后缀防覆盖）。
- `plan` 模式下除只读工具外，仅允许 **写/编辑该规范化路径**；其余路径的 `write_file` / `file_edit` 一律拒绝；路径须 `resolve` 后校验落在 workspace 内且等于 canonical 计划路径，防止 `..` 穿越。

### M3（多 Agent 并行执行，可选后续）

- 在计划文档中约定 **并行任务块** 的可解析格式；实现解析器与（在 Craft 等模式下）基于现有 `agent` 工具或任务 API 的 **并发/队列编排**、结果汇总策略及并发上限与安全边界。

## Capabilities

### New Capabilities

- `task-plan-mode`: 任务在 `plan` 模式下具备与 Ask/Craft 区分的工具暴露策略、系统说明与执行前校验；可选唯一计划文件写路径（M2）；可选从计划解析并行子任务并编排（M3）。

### Modified Capabilities

- 无独立 spec 的既有能力：`TaskExecutor` 工具列表与消息构建行为随 `mode` 变化（对 `ask`/`craft` 保持向后兼容）。

## Impact

- Affected code:
  - `src/tasks/executor.ts`（主改动）
  - 新建 `src/tasks/plan-mode-policy.ts`（或等价模块：白名单、路径 canonical、是否允许某 tool+input）
  - M2：`src/tools/file-edit.ts` / `src/tools/write-file.ts` 可选在执行层统一闸口，避免重复逻辑
  - M3：`src/tools/agent.ts`、`src/api/task-api.ts`（视现有子任务能力定）
  - `public/index.html`（M2 文案可选）
- Affected docs: 无强制新建；若已有「模式」说明可后续补链。
- External dependencies: 无。
