## Why

当前工具输出直接返回完整内容，导致两个问题：1) 大量输出消耗过多上下文窗口，影响对话效率；2) 输出格式不统一，用户体验差。参考 claude-code-main 的实现，需要建立工具结果映射和持久化机制，优化上下文使用和显示效果。

## What Changes

- 实现工具结果持久化系统，大结果自动存储到磁盘并返回预览
- 为每个工具添加 `mapToolResultToToolResultBlockParam` 方法，统一输出格式
- 实现按消息级别的结果预算控制（enforceToolResultBudget）
- 添加工具结果清理和压缩机制
- 建立工具实现规范文档，指导未来工具开发

## Capabilities

### New Capabilities
- `tool-result-persistence`: 工具结果持久化系统，包括存储、预览生成、文件管理
- `tool-result-mapping`: 工具结果到 API 格式的映射机制，统一输出格式
- `tool-result-budget`: 按消息级别控制工具结果大小，防止上下文溢出

### Modified Capabilities
- `tool-base`: 扩展工具基类，添加 `mapToolResultToToolResultBlockParam` 和 `maxResultSizeChars` 属性

## Impact

- **代码影响**：
  - `src/tools/base.ts` - 扩展工具接口
  - `src/tools/result-storage.ts` - 重构为完整的持久化系统
  - `src/tools/*.ts` - 所有工具需要实现新的映射方法
  - 新增 `src/tools/result-budget.ts` - 结果预算控制
  
- **API 影响**：
  - 工具返回格式变更，但向后兼容
  - 添加持久化文件路径到结果中
  
- **文档影响**：
  - 需要在 CLAUDE.md 中添加工具实现规范引用
  - 创建独立的工具开发指南文档
