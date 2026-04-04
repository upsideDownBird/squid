## ADDED Requirements

### Requirement: 系统应支持获取网页内容
系统 SHALL 支持通过 URL 获取网页内容并转换为 Markdown 格式。

#### Scenario: 成功获取 HTML 页面
- **WHEN** 用户提供有效的 HTTP/HTTPS URL
- **THEN** 系统获取页面内容并转换为 Markdown
- **AND** 返回转换后的内容

#### Scenario: 处理 HTTPS 升级
- **WHEN** 用户提供 HTTP URL
- **THEN** 系统自动升级为 HTTPS
- **AND** 尝试获取内容

#### Scenario: 处理请求失败
- **WHEN** 目标 URL 不可访问（404、超时等）
- **THEN** 系统返回错误信息
- **AND** 包含 HTTP 状态码和错误描述

### Requirement: 系统应实现 URL 缓存
系统 SHALL 缓存已获取的 URL 内容以提高性能。

#### Scenario: 缓存命中
- **WHEN** 用户请求已缓存的 URL（15 分钟内）
- **THEN** 系统直接返回缓存内容
- **AND** 不发起新的 HTTP 请求

#### Scenario: 缓存过期
- **WHEN** 缓存条目超过 15 分钟
- **THEN** 系统重新获取内容
- **AND** 更新缓存

#### Scenario: 缓存大小限制
- **WHEN** 缓存总大小超过 50MB
- **THEN** 系统使用 LRU 策略淘汰最旧的条目

### Requirement: 系统应转换 HTML 为 Markdown
系统 SHALL 将 HTML 内容转换为易读的 Markdown 格式。

#### Scenario: 转换标准 HTML 元素
- **WHEN** HTML 包含标题、段落、链接、列表等标准元素
- **THEN** 系统转换为对应的 Markdown 语法

#### Scenario: 处理转换失败
- **WHEN** HTML 结构无法正确解析
- **THEN** 系统返回原始 HTML 内容
- **AND** 记录错误日志

### Requirement: 工具应符合持久化规范
工具 SHALL 实现 mapToolResultToToolResultBlockParam 方法。

#### Scenario: 返回标准格式
- **WHEN** 工具执行完成
- **THEN** 返回 ToolResultBlockParam 格式
- **AND** 包含 tool_use_id 和 content

#### Scenario: 大内容自动持久化
- **WHEN** 转换后的 Markdown 超过 100K 字符
- **THEN** 持久化系统自动保存到磁盘
- **AND** 返回预览 + 文件路径
