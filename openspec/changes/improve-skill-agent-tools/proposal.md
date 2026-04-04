## Why

`skill` 和 `agent` 目前是可用但偏简化实现，和 `claude-code-main` 中的能力有明显差距：`skill` 只能展示技能内容而非执行流程，`agent` 直接调用模型而未复用统一执行栈与工具体系。这会导致行为不一致、可观测性弱、失败定位困难，也限制了后续扩展。

## What Changes

- 增强 `skill` 工具：从“仅返回技能文本”升级为“按技能定义驱动执行”，支持参数注入、调用约束校验、执行结果标准化输出。
- 增强 `agent` 工具：从“独立 Anthropic 直调”升级为“复用统一任务执行能力”，支持模型配置读取、超时/错误分类、结构化结果和可追踪上下文。
- 对齐 `claude-code-main` 的关键设计思路：统一执行入口、工具结果标准映射、失败可诊断、输出可持久化/可裁剪。
- 补充测试与文档，确保工具接口规范和行为预期稳定。

## Capabilities

### New Capabilities

- `skill-tool-execution`: `skill` 工具支持真实执行语义（读取技能定义、参数注入、调用策略校验、结果映射）。
- `agent-tool-orchestration`: `agent` 工具支持基于统一执行栈的子任务编排（配置加载、超时控制、错误处理、结果结构化）。

### Modified Capabilities

- （无）

## Impact

- Affected code:
  - `src/tools/skill.ts`
  - `src/tools/agent.ts`
  - `src/tasks/executor.ts`（按需复用能力）
  - `src/api/task-api.ts`（按需补充上下文传递）
  - `src/__tests__/tool-interface-compliance.test.ts`
  - `src/__tests__/agent.test.ts`
- Affected docs:
  - `docs/core-tools-guide.md`
  - `docs/tool-development-guide.md`（如需更新示例）
- External dependencies:
  - 无新增强制依赖（优先复用现有能力）
