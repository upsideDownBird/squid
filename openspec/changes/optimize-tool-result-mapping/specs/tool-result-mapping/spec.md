## ADDED Requirements

### Requirement: 工具应实现结果映射方法
每个工具 SHALL 实现 `mapToolResultToToolResultBlockParam` 方法，将工具输出转换为 API 格式。

#### Scenario: 映射文本结果
- **WHEN** 工具返回简单文本结果
- **THEN** 映射方法返回 `{ type: 'tool_result', tool_use_id: string, content: string }` 格式

#### Scenario: 映射 JSON 结果
- **WHEN** 工具返回结构化数据
- **THEN** 映射方法返回 `{ type: 'tool_result', tool_use_id: string, content: Array<{type: 'text', text: string}> }` 格式
- **AND** JSON 数据序列化为字符串

#### Scenario: 映射错误结果
- **WHEN** 工具执行失败
- **THEN** 映射方法返回 `{ type: 'tool_result', tool_use_id: string, content: string, is_error: true }` 格式
- **AND** 错误消息包含在 content 中

### Requirement: 映射方法应处理空结果
映射方法 SHALL 正确处理空或 undefined 的工具输出。

#### Scenario: 处理空字符串结果
- **WHEN** 工具返回空字符串或 undefined
- **THEN** 映射方法返回 `(${toolName} completed with no output)` 作为内容
- **AND** 防止 API 因空内容而产生错误

#### Scenario: 处理空数组结果
- **WHEN** 工具返回空的内容块数组
- **THEN** 映射方法返回包含完成消息的文本块

### Requirement: 映射应保留 MCP 元数据
映射方法 SHALL 保留 MCP 协议的元数据字段。

#### Scenario: 传递 MCP 元数据
- **WHEN** 工具结果包含 `_meta` 或 `structuredContent` 字段
- **THEN** 映射方法将这些字段附加到返回的 ToolResultBlockParam
- **AND** 元数据对 SDK 消费者可见

### Requirement: 映射应支持自定义格式化
工具 SHALL 能够自定义结果的格式化逻辑。

#### Scenario: 文件工具格式化路径
- **WHEN** ReadFile 工具返回文件内容
- **THEN** 映射方法在内容前添加文件路径信息
- **AND** 格式为 "File: /path/to/file\n\n<content>"

#### Scenario: Grep 工具格式化匹配结果
- **WHEN** Grep 工具返回匹配行
- **THEN** 映射方法格式化为 "Found N matches in M files:\n<matches>"
- **AND** 包含行号和上下文

### Requirement: 映射应与持久化集成
映射方法的输出 SHALL 作为持久化系统的输入。

#### Scenario: 映射后检查大小
- **WHEN** 映射方法返回 ToolResultBlockParam
- **THEN** 持久化系统检查 content 字段的大小
- **AND** 根据阈值决定是否持久化

#### Scenario: 持久化后替换内容
- **WHEN** 映射结果超过阈值并被持久化
- **THEN** 系统用预览消息替换原始 content
- **AND** 保持 tool_use_id 和其他字段不变
