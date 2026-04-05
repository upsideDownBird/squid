## 1. 后端：记忆提取核心

- [ ] 1.1 创建 `src/memory/prompts.ts` 定义 AI 提取提示词模板
- [ ] 1.2 在 `src/memory/types.ts` 添加提取相关类型定义
- [ ] 1.3 创建 `src/memory/extractor.ts` 实现 MemoryExtractor 类
- [ ] 1.4 实现 `extractMemories()` 方法调用 AI 分析对话
- [ ] 1.5 实现 `parseExtractionResponse()` 解析 AI 返回的 JSON
- [ ] 1.6 实现 `checkDuplicates()` 检测与现有记忆的重复（相似度 >0.7）
- [ ] 1.7 实现 `filterByConfidence()` 过滤低置信度建议（<0.7）
- [ ] 1.8 实现 `saveMemories()` 直接创建记忆文件
- [ ] 1.9 添加错误处理和降级策略

## 2. 后端：提取标记管理

- [x] 2.1 创建 `src/memory/extraction-marker.ts` 管理提取标记
- [x] 2.2 实现 `saveMarker()` 保存最后分析的消息索引
- [x] 2.3 实现 `getMarker()` 加载标记位置
- [x] 2.4 实现 `resetMarker()` 重置标记
- [x] 2.5 标记存储在 `~/.squid/extraction-marker.json`

## 3. 后端：提取触发器

- [ ] 3.1 在 `src/conversation/manager.ts` 添加提取触发逻辑
- [ ] 3.2 实现 `shouldTriggerExtraction()` 判断是否触发
- [ ] 3.3 实现对话轮次计数器
- [ ] 3.4 实现冷却期检查（5分钟）
- [ ] 3.5 在 `addMessage()` 中集成自动触发
- [ ] 3.6 实现 `triggerExtraction()` 异步触发提取
- [ ] 3.7 添加提取状态跟踪（进行中、完成、失败）

## 4. 后端：自动记忆管理

- [ ] 4.1 创建 `src/memory/auto-manager.ts` 实现自动清理
- [ ] 4.2 实现 `calculateMemoryScore()` 计算记忆价值分数
- [ ] 4.3 实现 `shouldCleanup()` 判断是否需要清理（>= 180 个）
- [ ] 4.4 实现 `cleanupLowValueMemories()` 清理低分记忆
- [ ] 4.5 实现保护机制（30 天内的记忆不清理）
- [ ] 4.6 实现清理日志记录到 `~/.squid/memory-cleanup.log`
- [ ] 4.7 在 MemoryManager 中集成自动清理检查

## 5. 后端：记忆访问跟踪

- [ ] 5.1 在 Memory 类型添加 `accessCount` 字段
- [ ] 5.2 在 MemorySelector.select() 中增加访问计数
- [ ] 5.3 实现 `incrementAccessCount()` 方法
- [ ] 5.4 更新记忆文件的 frontmatter 包含 accessCount

## 6. 后端：配置管理

- [ ] 6.1 在配置文件添加 ExtractionConfig 类型定义
- [ ] 6.2 实现 `loadExtractionConfig()` 加载配置
- [ ] 6.3 实现 `saveExtractionConfig()` 保存配置
- [ ] 6.4 添加默认配置值（enabled: true, triggerAfterTurns: 5, cooldownMinutes: 5）
- [ ] 6.5 实现配置验证逻辑

## 7. 后端：API 端点

- [ ] 7.1 在 `src/api/task-api.ts` 添加 `triggerManualExtraction()` 方法
- [ ] 7.2 添加 `getExtractionConfig()` 获取配置
- [ ] 7.3 添加 `saveExtractionConfig()` 保存配置
- [ ] 7.4 添加 `getExtractionStats()` 获取统计信息（已创建多少自动记忆）

## 8. 后端：路由注册

- [ ] 8.1 在 `src/bun/index.ts` 注册 POST /api/memory/extract
- [ ] 8.2 注册 GET /api/config/extraction
- [ ] 8.3 注册 POST /api/config/extraction
- [ ] 8.4 注册 GET /api/memory/stats

## 9. 前端：配置界面

- [ ] 9.1 在设置页面添加"自动记忆提取"配置区域
- [ ] 9.2 添加启用/禁用自动提取开关
- [ ] 9.3 添加触发轮次配置（滑块或输入框，默认 5）
- [ ] 9.4 添加对话结束时触发开关
- [ ] 9.5 添加冷却期配置（默认 5 分钟）
- [ ] 9.6 实现 `loadExtractionConfig()` 加载配置
- [ ] 9.7 实现 `saveExtractionConfig()` 保存配置
- [ ] 9.8 添加配置说明文本

## 10. 前端：统计信息显示（可选）

- [ ] 10.1 在设置页面显示自动提取统计
- [ ] 10.2 显示已创建的自动记忆数量
- [ ] 10.3 显示最后提取时间
- [ ] 10.4 显示清理历史摘要

## 11. 前端：记忆页面增强（可选）

- [ ] 11.1 在记忆卡片上显示"自动创建"标记（如果 autoCreated: true）
- [ ] 11.2 添加按创建方式过滤（手动/自动）
- [ ] 11.3 显示记忆的访问次数

## 12. 集成和测试

- [x] 12.1 测试对话 5 轮后自动触发提取和保存
- [x] 12.2 测试清除对话时触发提取
- [x] 12.3 测试手动触发提取
- [x] 12.4 测试重复检测功能（相似度 >0.7 跳过）
- [x] 12.5 测试标记机制（只分析新消息）
- [x] 12.6 测试冷却期机制
- [x] 12.7 测试自动清理功能（180 个阈值）
- [x] 12.8 测试记忆评分算法
- [x] 12.9 测试访问计数跟踪
- [x] 12.10 测试配置保存和加载
- [x] 12.11 测试错误处理和降级
- [x] 12.12 测试静默运行（无通知）
