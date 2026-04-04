## ADDED Requirements

### Requirement: 系统应实施消息级别的结果预算
系统 SHALL 控制单条消息中所有工具结果的总大小，防止上下文溢出。

#### Scenario: 检测超预算消息
- **WHEN** 一条用户消息中所有 tool_result 块的总大小超过 150,000 字符
- **THEN** 系统识别该消息为超预算
- **AND** 触发预算控制流程

#### Scenario: 选择最大结果持久化
- **WHEN** 消息超预算
- **THEN** 系统选择该消息中最大的工具结果进行持久化
- **AND** 持续持久化直到总大小降至预算内或无更多可持久化结果

#### Scenario: 保持预算内消息不变
- **WHEN** 消息的工具结果总大小在预算内
- **THEN** 系统不修改任何结果
- **AND** 返回原始消息数组

### Requirement: 系统应跟踪结果替换状态
系统 SHALL 维护每个 tool_use_id 的替换决策，确保跨轮次一致性。

#### Scenario: 记录首次替换决策
- **WHEN** 工具结果首次被预算控制处理
- **THEN** 系统记录该 tool_use_id 为已见（seenIds）
- **AND** 如果被替换，记录替换内容到 replacements Map

#### Scenario: 重新应用已有替换
- **WHEN** 相同的 tool_use_id 在后续轮次中出现
- **THEN** 系统从 replacements Map 读取缓存的替换内容
- **AND** 直接应用，无需重新持久化（保持字节一致性）

#### Scenario: 冻结未替换的结果
- **WHEN** 工具结果在首次处理时未被替换
- **THEN** 系统标记该 tool_use_id 为已见但未替换（frozen）
- **AND** 后续轮次永不替换该结果（保持提示缓存稳定）

### Requirement: 系统应按 API 消息边界分组
系统 SHALL 按照 API 实际发送的消息边界对工具结果分组。

#### Scenario: 合并连续用户消息
- **WHEN** 多条连续的用户消息之间没有助手消息
- **THEN** 系统将它们视为一个组（因为 normalizeMessagesForAPI 会合并）
- **AND** 对整个组应用预算控制

#### Scenario: 助手消息创建边界
- **WHEN** 用户消息之间有助手消息
- **THEN** 系统在助手消息处创建分组边界
- **AND** 每个组独立应用预算

#### Scenario: 忽略进度和附件消息
- **WHEN** 用户消息之间有 progress 或 attachment 消息
- **THEN** 系统不在这些消息处创建边界
- **AND** 因为它们会被 normalizeMessagesForAPI 过滤或合并

### Requirement: 系统应支持工具特定的豁免
系统 SHALL 允许特定工具豁免预算控制。

#### Scenario: 豁免 Infinity 阈值工具
- **WHEN** 工具的 maxResultSizeChars 为 Infinity（如 ReadFile）
- **THEN** 系统不将该工具的结果纳入预算计算
- **AND** 标记为已见但跳过持久化选择

#### Scenario: 豁免工具不计入总大小
- **WHEN** 计算消息的工具结果总大小
- **THEN** 系统排除豁免工具的结果
- **AND** 只对非豁免结果应用预算

### Requirement: 系统应处理并发持久化
系统 SHALL 并发持久化多个选中的结果以提高性能。

#### Scenario: 并发写入多个文件
- **WHEN** 预算控制选择多个结果进行持久化
- **THEN** 系统使用 Promise.all 并发执行持久化
- **AND** 等待所有持久化完成后更新状态

#### Scenario: 处理部分持久化失败
- **WHEN** 某些结果持久化失败
- **THEN** 系统将失败的结果标记为已见但未替换
- **AND** 成功的结果正常替换
- **AND** 继续处理不中断

### Requirement: 系统应记录预算执行指标
系统 SHALL 记录预算控制的执行情况用于监控。

#### Scenario: 记录持久化统计
- **WHEN** 预算控制完成处理
- **THEN** 系统记录：
  - 持久化的结果数量
  - 超预算的消息数量
  - 节省的总字节数
  - 重新应用的缓存替换数量

#### Scenario: 调试日志输出
- **WHEN** 有新的结果被持久化
- **THEN** 系统输出调试日志包含详细信息
- **AND** 格式为 "Per-message budget: persisted N results across M messages, shed ~X KB, Y re-applied"
