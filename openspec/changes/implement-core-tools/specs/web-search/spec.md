## ADDED Requirements

### Requirement: 网页搜索
系统 SHALL 支持搜索网页并返回结果列表。

#### Scenario: 成功搜索
- **WHEN** 用户提供搜索查询词
- **THEN** 系统返回前 10 条搜索结果，包含标题、链接和摘要

#### Scenario: 空查询
- **WHEN** 用户提供空字符串作为查询
- **THEN** 系统返回错误，要求提供有效的查询词

#### Scenario: 搜索失败
- **WHEN** 搜索服务不可用或网络错误
- **THEN** 系统返回友好的错误信息

### Requirement: 结果格式
系统 SHALL 返回结构化的搜索结果。

#### Scenario: 结果包含必要字段
- **WHEN** 搜索成功返回结果
- **THEN** 每条结果包含 title（标题）、url（链接）、snippet（摘要）字段

#### Scenario: 结果数量限制
- **WHEN** 搜索返回大量结果
- **THEN** 系统最多返回 10 条结果

### Requirement: 搜索引擎
系统 SHALL 使用 DuckDuckGo 作为默认搜索引擎。

#### Scenario: 使用 DuckDuckGo
- **WHEN** 用户执行搜索
- **THEN** 系统通过 DuckDuckGo 获取搜索结果

### Requirement: 超时控制
系统 SHALL 对搜索请求设置超时限制。

#### Scenario: 搜索超时
- **WHEN** 搜索请求超过 30 秒未响应
- **THEN** 系统终止请求并返回超时错误
