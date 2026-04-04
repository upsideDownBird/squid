## ADDED Requirements

### Requirement: 生成内容摘要
系统 SHALL 支持使用 AI 模型生成内容摘要。

#### Scenario: 成功生成摘要
- **WHEN** 用户提供内容文本
- **THEN** 系统调用 AI 模型生成简洁的摘要

#### Scenario: 自定义摘要提示
- **WHEN** 用户提供自定义的 prompt 参数
- **THEN** 系统使用该 prompt 指导摘要生成

#### Scenario: 内容过长
- **WHEN** 用户提供的内容超过模型上下文限制
- **THEN** 系统自动截断内容并生成摘要

### Requirement: 多种摘要类型
系统 SHALL 支持不同类型的摘要生成。

#### Scenario: 简短摘要
- **WHEN** 用户请求简短摘要（brief）
- **THEN** 系统生成 1-2 句话的摘要

#### Scenario: 详细摘要
- **WHEN** 用户请求详细摘要（detailed）
- **THEN** 系统生成包含关键点的段落摘要

#### Scenario: 要点列表
- **WHEN** 用户请求要点列表（bullet_points）
- **THEN** 系统生成结构化的要点列表

### Requirement: AI 模型配置
系统 SHALL 使用用户配置的 AI 模型生成摘要。

#### Scenario: 使用配置的模型
- **WHEN** 用户已配置 API 密钥
- **THEN** 系统使用配置的模型（OpenAI/Anthropic）生成摘要

#### Scenario: 未配置模型
- **WHEN** 用户未配置 API 密钥
- **THEN** 系统返回错误，提示需要配置 API 密钥
