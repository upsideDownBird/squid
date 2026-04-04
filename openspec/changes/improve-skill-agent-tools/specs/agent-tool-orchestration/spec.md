## ADDED Requirements

### Requirement: Agent tool MUST use unified execution stack
`agent` 工具 MUST 通过系统统一执行链路发起子任务（包括统一配置读取与执行上下文），而不是直接绑定单一模型 SDK 路径。

#### Scenario: Execute agent task via shared executor
- **WHEN** 调用 `agent` 工具并提供任务指令
- **THEN** 系统 SHALL 使用统一执行能力运行任务并返回执行结果

### Requirement: Agent tool MUST support timeout and error classification
`agent` 工具 MUST 支持可配置超时，并对超时、配置缺失、执行异常进行可区分的错误分类与返回。

#### Scenario: Timeout handling
- **WHEN** `agent` 任务执行时间超过指定 timeout
- **THEN** 系统 SHALL 中断任务并返回超时错误类型

#### Scenario: Missing config handling
- **WHEN** 调用 `agent` 工具时缺少必要模型配置或凭据
- **THEN** 系统 SHALL 返回配置错误并标记任务失败

### Requirement: Agent tool MUST return structured and traceable result
`agent` 工具 MUST 返回结构化结果，至少包含 success、result/error、duration，并保留可追踪元信息用于日志和调试。

#### Scenario: Successful execution payload
- **WHEN** `agent` 任务执行成功
- **THEN** 系统 SHALL 返回包含执行耗时和结果内容的结构化成功响应
