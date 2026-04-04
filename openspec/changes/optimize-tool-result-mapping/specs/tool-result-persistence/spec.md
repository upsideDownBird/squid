## ADDED Requirements

### Requirement: 系统应持久化大型工具结果
系统 SHALL 在工具结果超过配置的大小阈值时，将结果持久化到磁盘并返回预览。

#### Scenario: 结果超过阈值时持久化
- **WHEN** 工具返回的结果大小超过 maxResultSizeChars（默认 50,000 字符）
- **THEN** 系统将完整结果写入 `~/.jobopx/sessions/<sessionId>/tool-results/<toolUseId>.txt`
- **AND** 返回包含前 2,000 字节预览和文件路径的消息

#### Scenario: 结果未超过阈值时直接返回
- **WHEN** 工具返回的结果大小小于或等于 maxResultSizeChars
- **THEN** 系统直接返回完整结果，不进行持久化

#### Scenario: JSON 格式结果的持久化
- **WHEN** 工具返回的是 JSON 数组格式的结果且超过阈值
- **THEN** 系统将结果保存为 `<toolUseId>.json` 文件
- **AND** 预览消息中标注为 JSON 格式

### Requirement: 系统应生成结果预览
系统 SHALL 为持久化的结果生成可读的预览消息。

#### Scenario: 生成文本预览
- **WHEN** 结果被持久化到文件
- **THEN** 预览消息包含：
  - 原始大小信息（格式化为人类可读，如 "125.5 KB"）
  - 文件完整路径
  - 前 2,000 字节的内容预览
  - "..." 截断标记（如果有更多内容）

#### Scenario: 预览在换行边界截断
- **WHEN** 预览大小限制在内容中间
- **THEN** 系统在最后一个换行符处截断（如果该换行符在预览大小的 50% 之后）
- **AND** 避免在单词或行中间截断

### Requirement: 系统应管理持久化文件的生命周期
系统 SHALL 按会话隔离存储文件，并支持清理机制。

#### Scenario: 按会话隔离存储
- **WHEN** 不同会话的工具执行产生结果
- **THEN** 每个会话的结果存储在独立的目录 `~/.jobopx/sessions/<sessionId>/tool-results/`
- **AND** 使用 toolUseId 作为文件名确保唯一性

#### Scenario: 避免重复写入
- **WHEN** 同一个 toolUseId 的结果已经持久化
- **THEN** 系统跳过写入操作（使用 'wx' flag）
- **AND** 直接读取现有文件生成预览

#### Scenario: 处理持久化失败
- **WHEN** 文件写入失败（如磁盘空间不足、权限问题）
- **THEN** 系统返回原始的工具结果块（不持久化）
- **AND** 记录错误日志但不中断工具执行

### Requirement: 系统应支持配置持久化阈值
系统 SHALL 允许为不同工具配置不同的持久化阈值。

#### Scenario: 使用工具特定阈值
- **WHEN** 工具定义了 maxResultSizeChars 属性
- **THEN** 系统使用该值与全局默认值（50,000）中的较小值作为阈值

#### Scenario: 禁用特定工具的持久化
- **WHEN** 工具的 maxResultSizeChars 设置为 Infinity
- **THEN** 系统永不持久化该工具的结果
- **AND** 始终返回完整内容（如 ReadFile 工具自己控制大小）

### Requirement: 系统应处理非文本内容
系统 SHALL 正确处理包含图片或其他非文本内容的工具结果。

#### Scenario: 跳过包含图片的结果
- **WHEN** 工具结果包含 image 类型的内容块
- **THEN** 系统不持久化该结果
- **AND** 直接返回原始内容块（图片必须发送给 API）

#### Scenario: 只持久化文本块
- **WHEN** 工具结果是内容块数组
- **THEN** 系统只检查和持久化 text 类型的块
- **AND** 拒绝持久化包含非文本块的结果
