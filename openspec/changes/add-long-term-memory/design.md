## Context

Jobopx Desktop 当前已实现短期对话记忆（ConversationManager），但缺少跨会话的长期记忆能力。参考 claude-code 的实现，我们需要添加基于文件的持久化记忆系统。

**当前状态**:
- 已有 `ConversationManager` 管理会话内消息历史
- 对话历史存储在 `~/.squid/conversations/`
- TaskExecutor 在调用 AI 时会传入对话历史

**约束**:
- 必须与现有的 ConversationManager 共存
- 记忆文件使用 Markdown + frontmatter 格式以便人类可读可编辑
- 性能要求：记忆加载不应显著增加响应延迟（目标 <100ms）
- 兼容 OpenAI 和 Anthropic API 格式

## Goals / Non-Goals

**Goals:**
- 实现四种记忆类型：user（用户信息）、feedback（反馈建议）、project（项目信息）、reference（参考资料）
- 记忆文件自动加载并注入到 AI 上下文
- 提供完整的记忆管理 UI（查看、创建、编辑、删除）
- 支持记忆搜索和按类型过滤
- 实现记忆索引文件（MEMORY.md）用于快速浏览

**Non-Goals:**
- 不实现自动记忆提取（AI 自动从对话中创建记忆）- 留待后续迭代
- 不实现记忆的向量搜索或语义匹配 - 使用简单的文件扫描
- 不实现记忆的版本控制或历史记录
- 不实现跨项目的记忆共享

## Decisions

### 1. 对话历史渐进式压缩机制（4 层策略）

**决策**: 参考 claude-code 实现渐进式压缩策略，从轻量到重量级逐步尝试

**4 层渐进式压缩策略**:

**第 1 层：微压缩（Microcompact）- 清除冗余内容**
- 触发条件：token 使用率达到 70%
- 操作：
  - 清除旧的工具调用结果（保留最近 5 个）
  - 清除旧的思考块内容（如果有）
  - 清除已读文件的完整内容，保留文件路径引用
- 优点：快速、无需 AI 调用、不丢失对话结构
- 预期节省：20-40% token

**第 2 层：智能截断（Smart Truncation）**
- 触发条件：微压缩后仍超过 75%
- 操作：
  - 保留最近 20 条消息
  - 删除最旧的消息
  - 在截断点插入标记："[早期对话已截断]"
- 优点：简单快速、无需 AI 调用
- 缺点：完全丢失旧对话信息
- 预期节省：30-50% token

**第 3 层：部分压缩（Partial Compact）**
- 触发条件：截断后仍超过 80%
- 操作：
  - 选择中间部分的对话（如消息 10-30）
  - 使用 AI 生成这部分的简短摘要
  - 保留开头和结尾的完整对话
- 优点：保留关键上下文、成本较低
- 预期节省：40-60% token

**第 4 层：完整压缩（Full Compact）**
- 触发条件：部分压缩后仍超过 85% 或用户手动触发
- 操作：
  - 使用 AI 生成整个旧对话的详细摘要
  - 摘要包含：用户请求、技术概念、文件修改、错误、反馈、待办任务、当前工作
  - 保留最近 10 条消息
  - 插入压缩边界标记
- 优点：保留最完整的上下文信息
- 缺点：需要 AI 调用、耗时较长
- 预期节省：60-80% token

**理由**:
- 渐进式策略避免过早使用昂贵的 AI 压缩
- 每层都有明确的触发条件和降级路径
- 参考 claude-code 的生产环境验证实现

**实现示例**:
```typescript
async function manageConversationContext(messages: Message[]): Promise<Message[]> {
  const tokenCount = estimateTokens(messages)
  const limit = getModelContextLimit()
  const usage = tokenCount / limit

  // 第 1 层：微压缩
  if (usage > 0.70) {
    messages = await microcompact(messages)
    const newUsage = estimateTokens(messages) / limit
    if (newUsage < 0.75) return messages
  }

  // 第 2 层：智能截断
  if (usage > 0.75) {
    messages = truncateOldMessages(messages, keepRecent: 20)
    const newUsage = estimateTokens(messages) / limit
    if (newUsage < 0.80) return messages
  }

  // 第 3 层：部分压缩
  if (usage > 0.80) {
    messages = await partialCompact(messages)
    const newUsage = estimateTokens(messages) / limit
    if (newUsage < 0.85) return messages
  }

  // 第 4 层：完整压缩
  return await fullCompact(messages)
}
```

**替代方案**:
- 单一策略：无法平衡成本和效果
- 只用截断：会丢失重要上下文
- 只用完整压缩：成本高、延迟大

### 2. 记忆存储格式：Markdown + Frontmatter

**决策**: 使用 Markdown 文件，包含 YAML frontmatter 元数据

```markdown
---
name: user_role
description: 用户的角色和专业领域
type: user
created: 2026-04-04T10:30:00Z
updated: 2026-04-04T10:30:00Z
---

用户是一名全栈开发工程师，主要使用 TypeScript 和 React。
```

**理由**:
- 人类可读可编辑，用户可以直接用文本编辑器修改
- Frontmatter 提供结构化元数据，便于索引和过滤
- 与 claude-code 的格式一致，降低学习成本

**替代方案**:
- JSON 格式：更易解析但不够人类友好
- 纯文本：缺少元数据结构

### 2. 记忆目录结构：按类型分组

**决策**: 
```
~/.squid/memory/
├── MEMORY.md          # 索引文件
├── user/              # 用户信息
│   ├── role.md
│   └── preferences.md
├── feedback/          # 反馈建议
│   ├── coding_style.md
│   └── testing_approach.md
├── project/           # 项目信息
│   └── current_work.md
└── reference/         # 参考资料
    └── api_endpoints.md
```

**理由**:
- 按类型分组便于管理和浏览
- MEMORY.md 作为索引提供快速概览
- 扁平的子目录结构，避免过度嵌套

**替代方案**:
- 所有记忆放在同一目录：难以管理大量文件
- 按项目分组：当前是单项目应用，不需要

### 3. 记忆注入策略：4 层压缩机制

**决策**: 参考 claude-code 实现 4 层压缩机制，确保记忆系统在任何规模下都高效运行

**4 层压缩机制**:

**第 1 层：记忆文件数量限制（200 个）**
- 扫描记忆目录时，按修改时间排序
- 只保留最新的 200 个记忆文件
- 超出的旧文件被忽略（不删除，只是不加载）

**第 2 层：MEMORY.md 索引文件限制（200 行或 25KB）**
- MEMORY.md 作为记忆索引，列出所有记忆的简要描述
- 限制：200 行或 25KB（以先达到者为准）
- 超出时截断并添加警告提示

**第 3 层：智能相关性选择（最多 5 个）**
- 使用 AI 模型分析用户查询和记忆描述
- 从 200 个记忆中选择最相关的 5 个
- 去重：跟踪已展示的记忆，避免重复

**第 4 层：单个记忆内容压缩（200 行或 4KB）**
- 读取选中的记忆文件时限制大小
- 限制：200 行或 4KB（以先达到者为准）
- 超出时截断并添加提示，告知可用 Read 工具查看完整内容

**理由**:
- 多层压缩确保在任何规模下都不会超出 token 限制
- 每层都有明确的限制和降级策略
- 参考 claude-code 的生产环境验证的实现

**实现示例**:
```typescript
// 第 1 层：扫描并限制文件数量
const allMemories = await scanMemoryDir(memoryDir)
const recentMemories = allMemories
  .sort((a, b) => b.mtimeMs - a.mtimeMs)
  .slice(0, 200) // 最多 200 个

// 第 2 层：MEMORY.md 索引限制
const memoryIndex = await readMemoryIndex(memoryDir)
const truncatedIndex = truncateIndex(
  memoryIndex,
  MAX_LINES: 200,
  MAX_BYTES: 25000
)

// 第 3 层：AI 选择最相关的 5 个
const selected = await selectRelevantMemories(
  userQuery,
  recentMemories,
  alreadySurfaced
) // 返回最多 5 个

// 第 4 层：读取并压缩单个记忆
const compressed = await Promise.all(
  selected.map(m => readMemoryWithLimit(
    m.path,
    MAX_LINES: 200,
    MAX_BYTES: 4096
  ))
)
```

**替代方案**:
- 单层限制：可能在某些情况下仍然超出 token 限制
- 固定 token 预算：难以精确控制，不同模型 token 计算不同
- 全量加载：完全不可行，会快速超出上下文限制

### 4. 记忆管理 UI：独立页面

**决策**: 在侧边栏添加"记忆"导航项，提供独立的记忆管理页面

**功能**:
- 列表视图：显示所有记忆，支持按类型过滤
- 创建/编辑：表单界面，包含类型、名称、描述、内容字段
- 删除：带确认的删除操作
- 搜索：按名称或内容搜索

**理由**:
- 独立页面提供更好的用户体验
- 与现有的"技能"、"专家"页面保持一致

## Risks / Trade-offs

### 风险 1: AI 选择器调用增加延迟和成本
**缓解措施**: 
- 使用轻量级模型（如 Haiku）进行选择，成本低且速度快
- 设置 2 秒超时，失败时降级到最近 5 个记忆
- 缓存记忆扫描结果，避免重复读取文件系统

### 风险 2: 记忆选择不准确导致相关信息缺失
**缓解措施**:
- 提供手动"固定记忆"功能，让用户强制包含特定记忆
- 在 UI 中显示当前对话使用了哪些记忆
- 允许用户在对话中手动添加记忆

### 风险 3: 200 个记忆文件限制可能不够
**缓解措施**:
- 按修改时间排序，确保最近的记忆被保留
- 在 UI 中提示用户清理旧记忆
- 后续可以实现记忆归档功能

### 风险 4: 记忆内容截断可能丢失重要信息
**缓解措施**:
- 截断时添加明确提示，告知用户可以用 Read 工具查看完整内容
- 在 UI 中显示记忆大小警告
- 建议用户将长记忆拆分为多个小记忆

### 风险 5: 用户手动编辑记忆文件导致格式错误
**缓解措施**:
- 在加载时进行格式验证，跳过无效文件
- 在 UI 中显示验证错误提示
- 提供记忆文件格式文档

### Trade-off: 智能选择 vs 简单实现
选择智能选择机制增加了复杂度（需要 AI 调用），但显著提升了相关性和 token 效率。参考 claude-code 的成熟实现，这是值得的权衡。
