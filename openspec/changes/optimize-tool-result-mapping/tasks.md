## 1. 基础设施搭建

- [x] 1.1 创建 `src/tools/tool-result-storage.ts` - 实现 ToolResultStorage 类
- [x] 1.2 实现 `persistToolResult` 函数 - 持久化工具结果到磁盘
- [x] 1.3 实现 `getToolResultPath` 函数 - 生成结果文件路径
- [x] 1.4 实现 `ensureToolResultsDir` 函数 - 确保存储目录存在
- [x] 1.5 添加预览生成逻辑 - 生成 2000 字节预览和元数据

## 2. 工具接口扩展

- [x] 2.1 修改 `src/tools/base.ts` - 添加 `mapToolResultToToolResultBlockParam` 方法签名
- [x] 2.2 添加 `maxResultSizeChars` 属性到 Tool 接口
- [x] 2.3 实现默认映射方法 - 为未实现映射的工具提供默认行为
- [x] 2.4 更新 Tool 类型导出 - 确保类型定义完整

## 3. 结果映射实现

- [x] 3.1 为 ReadFileTool 实现 mapToolResultToToolResultBlockParam
- [x] 3.2 为 GrepTool 实现 mapToolResultToToolResultBlockParam
- [x] 3.3 为 GlobTool 实现 mapToolResultToToolResultBlockParam
- [x] 3.4 为 WriteFileTool 实现 mapToolResultToToolResultBlockParam
- [x] 3.5 为 SaveMemoryTool 实现 mapToolResultToToolResultBlockParam

## 4. 结果预算控制

- [x] 4.1 创建 `src/tools/result-budget.ts` - 实现预算控制模块
- [x] 4.2 实现 `enforceToolResultBudget` 函数 - 消息级别预算控制
- [x] 4.3 实现 `groupMessagesByApiBlock` 函数 - 按 API 边界分组消息
- [x] 4.4 实现 `ContentReplacementState` 类型 - 跟踪替换状态
- [x] 4.5 实现 `selectLargestResults` 函数 - 选择最大结果持久化

## 5. 集成和测试

- [x] 5.1 在工具执行流程中集成 processToolResultBlock
- [ ] 5.2 在消息发送前应用 enforceToolResultBudget
- [ ] 5.3 编写 ToolResultStorage 单元测试
- [ ] 5.4 编写 enforceToolResultBudget 单元测试
- [ ] 5.5 编写工具映射方法的集成测试

## 6. 文档和规范

- [x] 6.1 创建 `docs/tool-development-guide.md` - 工具开发指南
- [x] 6.2 在指南中添加映射方法实现示例
- [x] 6.3 在指南中说明 maxResultSizeChars 的使用
- [x] 6.4 更新 `CLAUDE.md` - 添加工具实现规范引用
- [x] 6.5 添加持久化文件清理说明到文档

## 7. 性能优化和错误处理

- [ ] 7.1 添加持久化失败的降级处理
- [ ] 7.2 实现文件写入的并发控制（避免重复写入）
- [ ] 7.3 添加磁盘空间检查和告警
- [ ] 7.4 优化预览生成性能（在换行边界截断）
- [ ] 7.5 添加调试日志和性能指标记录
