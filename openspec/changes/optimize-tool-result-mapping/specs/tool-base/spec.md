## MODIFIED Requirements

### Requirement: 工具接口应包含结果映射方法
Tool 接口 SHALL 包含 `mapToolResultToToolResultBlockParam` 方法用于格式化输出。

#### Scenario: 定义映射方法签名
- **WHEN** 定义 Tool 接口
- **THEN** 接口包含方法：
  ```typescript
  mapToolResultToToolResultBlockParam(
    content: Output,
    toolUseID: string
  ): ToolResultBlockParam
  ```
- **AND** 方法为必需实现

#### Scenario: 工具实现映射方法
- **WHEN** 创建新工具
- **THEN** 工具必须实现 mapToolResultToToolResultBlockParam
- **AND** 返回符合 Anthropic SDK 的 ToolResultBlockParam 类型

### Requirement: 工具接口应声明最大结果大小
Tool 接口 SHALL 包含 `maxResultSizeChars` 属性声明持久化阈值。

#### Scenario: 定义最大结果大小属性
- **WHEN** 定义 Tool 接口
- **THEN** 接口包含属性：`maxResultSizeChars: number`
- **AND** 属性为必需字段

#### Scenario: 设置默认阈值
- **WHEN** 工具未特别指定大小限制
- **THEN** 设置 maxResultSizeChars 为 50000
- **AND** 与全局默认值保持一致

#### Scenario: 禁用持久化
- **WHEN** 工具需要完全控制输出大小（如 ReadFile）
- **THEN** 设置 maxResultSizeChars 为 Infinity
- **AND** 持久化系统跳过该工具

### Requirement: 工具接口应保持向后兼容
Tool 接口的扩展 SHALL 不破坏现有工具实现。

#### Scenario: 现有工具继续工作
- **WHEN** 现有工具未实现新方法
- **THEN** 系统提供默认实现
- **AND** 默认实现返回简单的文本格式结果

#### Scenario: 渐进式迁移
- **WHEN** 逐步为工具添加映射方法
- **THEN** 已实现的工具使用自定义映射
- **AND** 未实现的工具使用默认映射
- **AND** 两者可以共存
