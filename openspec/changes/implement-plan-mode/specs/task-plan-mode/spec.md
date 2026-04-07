## ADDED Requirements

### Requirement: Plan 模式工具暴露与执行闸

当任务 `mode` 为 `plan` 时，系统 SHALL 仅向模型暴露规划期允许的工具定义；对任何非允许工具调用 SHALL 在执行前拒绝并返回可读错误信息，且 SHALL NOT 执行对应工具副作用。

#### Scenario: Plan 下列表不含写仓库类工具

- **WHEN** 任务以 `plan` 模式发起流式或非流式执行
- **THEN** 下发给模型的 `tools` 列表不包含 `bash`、`powershell`、`file_edit`、`write_file`（M1；M2 起 `write_file`/`file_edit` 仅在满足计划路径规则时可见且可执行）、`agent`、`skill`、`cron_create`、`cron_delete`、`save_memory` 等（以 `openspec/changes/implement-plan-mode/design.md` 白名单为准）

#### Scenario: 模型仍输出禁用工具调用

- **WHEN** `plan` 模式下模型产生非允许 `tool_calls`
- **THEN** 宿主不调用工具实现，并向对话上下文注入说明当前为 Plan 模式的错误结果

#### Scenario: Ask 与 Craft 兼容

- **WHEN** 任务 `mode` 为 `ask` 或 `craft`
- **THEN** 工具列表与改前行为一致（除明确修复的 bug 外无意外缩权）

---

### Requirement: Plan 模式系统说明与 mode 贯通

系统 SHALL 将真实 `TaskMode` 传入消息构建与 `ToolContext.mode`。

#### Scenario: 规划期系统说明

- **WHEN** `mode === 'plan'`
- **THEN** 系统消息中包含固定中文说明：当前为规划阶段、不得修改业务代码或通过非只读手段改变环境、用户需切换至 Ask/Craft 后再实现（M2 补充计划文件路径与唯一写出口）

#### Scenario: ToolContext.mode

- **WHEN** 任意工具在任务执行过程中被调用
- **THEN** `ToolContext.mode` 与当前任务 `mode` 一致，而非写死常量

---

### Requirement: 工作区内计划文件（M2）

`plan` 模式下，系统 SHALL 仅允许向 **当前 workspace 内 canonical 计划文件路径** 进行创建或编辑写入；对所有其他路径的写类工具调用 SHALL 拒绝。

#### Scenario: 写入默认计划文件成功

- **WHEN** `mode === 'plan'` 且工具目标路径为规范化后的 `<workspace>/.squid/plan.md`（或实现选定的带会话后缀的等价路径）
- **THEN** `write_file` 或 `file_edit` 允许执行（在满足既有工具校验前提下）

#### Scenario: 写入业务文件被拒绝

- **WHEN** `mode === 'plan'` 且目标路径为 workspace 内非 canonical 计划路径（例如 `src/app.ts`）
- **THEN** 拒绝执行并返回明确错误

#### Scenario: 路径穿越被拒绝

- **WHEN** `mode === 'plan'` 且参数路径经解析后脱离 workspace 根或不等于 canonical 计划路径
- **THEN** 拒绝执行

---

### Requirement: 计划内并行任务解析与编排（M3，可选）

若启用 M3，系统 SHALL 能从计划正文解析出结构化并行子任务，并 SHALL 支持在实现阶段按策略触发多路子任务执行与结果汇总（并发上限可配置）。

#### Scenario: 解析并行块

- **WHEN** 计划文件包含符合约定格式的并行任务块
- **THEN** 解析器产出有序子任务列表（含至少 `id` 与 `prompt` 或等价字段）

#### Scenario: 并发上限

- **WHEN** 子任务数量大于配置的上限
- **THEN** 系统通过队列或批处理限制同时执行数，且不静默丢任务

#### Scenario: 单路子任务失败

- **WHEN** 某一子任务执行失败
- **THEN** 行为符合 `design.md` 中失败策略（记录错误、可选取消余下任务或继续），且对用户或日志可观测
