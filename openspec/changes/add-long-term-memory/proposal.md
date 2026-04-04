## Why

当前 Jobopx Desktop 只有短期对话记忆（会话内的消息历史），缺少长期记忆能力。用户无法让 AI 记住跨会话的个人偏好、项目信息、工作习惯等重要上下文。参考 claude-code 的 memory 系统，我们需要实现持久化的长期记忆功能，让 AI 能够记住用户信息、项目背景、反馈建议等，提供更个性化和连贯的体验。

## What Changes

- 添加文件基础的记忆系统，支持多种记忆类型（用户信息、反馈、项目信息、参考资料）
- 实现记忆文件的自动加载和注入到 AI 上下文
- 提供记忆管理 UI，允许用户查看、编辑、删除记忆
- 添加记忆搜索和过滤功能
- 实现记忆的自动保存和更新机制
- 支持从对话中提取关键信息自动创建记忆
- **实现对话历史自动压缩机制，当上下文接近限制时生成摘要**

## Capabilities

### New Capabilities
- `memory-storage`: 基于文件系统的记忆存储和检索，支持多种记忆类型（user, feedback, project, reference）
- `memory-injection`: 将相关记忆自动注入到 AI 对话上下文中
- `memory-management-ui`: 用户界面用于查看、创建、编辑和删除记忆文件
- `memory-extraction`: 从对话中自动识别和提取值得记住的信息

### Modified Capabilities
<!-- 无现有功能需要修改规范 -->

## Impact

- **后端**: 
  - 新增 `src/memory/` 模块用于记忆管理
  - 修改 `TaskExecutor` 以注入记忆到 AI 上下文
  - 新增 API 端点用于记忆 CRUD 操作

- **前端**:
  - 新增"记忆"页面用于记忆管理
  - 在设置中添加记忆相关配置选项

- **存储**:
  - 记忆文件存储在 `~/.jobopx/memory/` 目录
  - 使用 Markdown 格式，包含 frontmatter 元数据

- **性能**:
  - 需要在每次对话时加载和过滤相关记忆
  - 记忆文件数量增长可能影响加载速度，需要实现缓存机制
