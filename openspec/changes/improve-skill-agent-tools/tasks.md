## 1. Baseline and interface alignment

- [x] 1.1 梳理并冻结 `src/tools/skill.ts` 与 `src/tools/agent.ts` 现有输入输出契约，明确兼容字段（`skill_name/args`、`instruction/timeout`）。
- [x] 1.2 对照 `claude-code-main` 提炼可复用能力点（统一执行入口、错误分类、结果结构化），形成本次实现清单。

## 2. Agent tool orchestration

- [x] 2.1 重构 `agent` 工具，使其通过统一执行链路运行任务，移除单一模型直连路径。
- [x] 2.2 实现 `agent` 的超时控制与错误分类（超时、配置缺失、执行异常），并统一错误输出结构。
- [x] 2.3 增加 `agent` 执行元信息输出（duration、metadata）并保持 `mapToolResultToToolResultBlockParam` 一致映射。

## 3. Skill tool execution

- [x] 3.1 重构 `skill` 工具为可执行语义：加载技能后完成调用约束校验并触发执行流程。
- [x] 3.2 完善 `skill` 工具失败路径（技能不存在、不可调用、执行异常）的结构化返回与错误标记。
- [x] 3.3 统一 `skill` 工具成功/失败结果结构，确保输出可被上游稳定消费。

## 4. Integration, tests, and docs

- [x] 4.1 补充并更新测试：`src/__tests__/agent.test.ts`、`src/__tests__/tool-interface-compliance.test.ts`，覆盖关键成功/失败场景。
- [x] 4.2 增加必要的集成验证（至少一次 `skill` 与 `agent` 的真实调用路径验证）。
- [x] 4.3 更新 `docs/core-tools-guide.md` 与相关开发文档，说明能力升级与行为变化。
