## Context

Jobopx Desktop 已实现完整的长期记忆系统（add-long-term-memory 变更），包括：
- 记忆存储和管理（MemoryManager, MemoryStorage）
- 4 层智能压缩机制（MemorySelector）
- 自动注入到 AI 上下文（TaskExecutor）
- 完整的 UI 管理界面
- 手动创建记忆功能（从聊天消息添加按钮）

**当前状态**:
- 用户必须手动点击按钮创建记忆
- 对话历史保存在 ConversationManager 中
- AI 响应在 TaskAPI.executeTaskStream() 中处理
- 已有记忆去重检测逻辑（calculateSimilarity）

**约束**:
- 记忆系统限制：最多 200 个记忆，单个记忆 4KB
- 必须保持用户对记忆内容的控制权（半自动，非完全自动）
- 额外的 AI 调用应该异步非阻塞
- 需要兼容现有的记忆管理流程

**参考实现**:
- claude-code 的 auto memory 系统作为参考
- 已有的手动记忆提取功能（showAddToMemoryDialog）

## Goals / Non-Goals

**Goals:**
- 自动识别对话中值得记住的内容（用户偏好、反馈、项目信息、技术洞察）
- 提供 AI 生成的记忆建议，用户可以快速审查和确认
- 支持多种触发方式（N 轮对话后、对话结束时、手动触发）
- 避免创建重复记忆
- 保持低延迟，不阻塞对话流程
- 提供配置选项让用户控制自动提取行为

**Non-Goals:**
- 不实现完全自动保存（必须用户确认）
- 不实现跨对话的记忆合并或聚合
- 不实现记忆的自动更新或修改
- 不实现基于向量的语义搜索（使用简单的文本相似度）

## Decisions

### 1. 完全自动提取策略：AI 分析后直接保存

**决策**: 使用完全自动模式，AI 分析后直接创建记忆，无需用户确认

**理由**:
- 真正的自动化，零手动操作
- 用户可以在记忆页面随时查看、编辑、删除
- 去重机制避免冗余
- 智能管理确保不超过 200 个限制

**实现**:
```typescript
// 提取流程
1. AI 分析对话 → 生成记忆列表
2. 去重检测（相似度 >0.7 的跳过）
3. 直接调用 MemoryManager.create() 创建记忆
4. 静默完成，无通知打扰
5. 用户可以在记忆页面查看所有记忆
```

**与手动创建的区别**:
- 自动创建的记忆可以添加 `autoCreated: true` 标记（可选）
- 用户在记忆页面可以看到所有记忆，不区分来源
- 用户随时可以编辑或删除任何记忆

### 2. 提取触发机制：多种触发方式

**决策**: 支持三种触发方式，默认启用"N 轮对话后"

**触发方式**:
1. **N 轮对话后** (默认 5 轮) - 自动触发
2. **对话结束时** (清除对话、新对话) - 自动触发
3. **手动触发** (按钮) - 用户主动触发

**理由**:
- 5 轮对话通常包含足够的上下文
- 对话结束时是自然的提取时机
- 手动触发提供灵活性
- 冷却期（5 分钟）避免频繁提取

**配置选项**:
```typescript
interface ExtractionConfig {
  enabled: boolean;           // 启用/禁用自动提取
  triggerAfterTurns: number;  // N 轮后触发（默认 5）
  triggerOnEnd: boolean;      // 对话结束时触发（默认 true）
  cooldownMinutes: number;    // 冷却期（默认 5）
}
```

### 3. AI 提取提示词设计

**决策**: 使用结构化提示词，要求 AI 返回 JSON 格式的建议列表

**提示词结构**:
```
你是一个记忆提取助手。分析以下对话，识别值得保存为长期记忆的内容。

对话历史：
[对话内容]

已有记忆摘要：
[现有记忆的名称和描述]

请识别以下类型的内容：
1. user - 用户偏好、角色、技能、习惯
2. feedback - 用户反馈、建议、要避免的事项
3. project - 项目信息、需求、决策
4. reference - 技术知识、文档、参考资料

返回 JSON 数组，每个建议包含：
{
  "type": "user|feedback|project|reference",
  "name": "简短名称（<50字符）",
  "description": "一句话描述",
  "content": "详细内容",
  "confidence": 0.0-1.0,
  "sourceMessages": [消息索引]
}

只返回高置信度（>0.7）的建议，最多 5 个。
```

**理由**:
- 结构化输出易于解析
- 包含置信度帮助过滤低质量建议
- 提供现有记忆避免重复
- 限制 5 个避免过载

### 4. 记忆自动管理：智能清理机制

**决策**: 当记忆接近 200 个限制时，自动清理低价值记忆

**清理策略**:
1. **优先级评分**: 根据记忆的访问频率、创建时间、类型计算分数
2. **清理阈值**: 达到 180 个记忆时触发清理
3. **清理数量**: 每次清理最多 20 个低分记忆
4. **保护机制**: 最近 30 天创建的记忆不清理

**评分算法**:
```typescript
function calculateMemoryScore(memory: Memory): number {
  const ageInDays = (Date.now() - new Date(memory.metadata.created).getTime()) / (1000 * 60 * 60 * 24);
  const accessCount = memory.accessCount || 0;
  
  // 类型权重：user > feedback > project > reference
  const typeWeight = {
    user: 1.5,
    feedback: 1.3,
    project: 1.2,
    reference: 1.0
  }[memory.metadata.type];
  
  // 分数 = 访问次数 * 类型权重 / 年龄（天）
  return (accessCount + 1) * typeWeight / Math.max(ageInDays, 1);
}
```

**理由**:
- 自动维护记忆数量在限制内
- 保留高价值记忆
- 用户无需手动清理

### 5. 去重检测：基于现有逻辑

**决策**: 复用现有的 `calculateSimilarity` 函数，阈值 0.7

**实现**:
```typescript
async function checkDuplicates(suggestion: MemorySuggestion): Promise<{
  isDuplicate: boolean;
  duplicateOf?: string;
}> {
  const existingMemories = await memoryManager.list();
  
  for (const memory of existingMemories) {
    const similarity = calculateSimilarity(memory.content, suggestion.content);
    if (similarity > 0.7) {
      return {
        isDuplicate: true,
        duplicateOf: memory.id
      };
    }
  }
  
  return { isDuplicate: false };
}
```

**理由**:
- 复用现有代码，保持一致性
- Jaccard 相似度简单有效
- 0.7 阈值经过验证

### 6. 静默运行：无 UI 通知

**决策**: 提取和保存过程完全静默，不显示任何通知或 UI

**理由**:
- 避免打扰用户
- 真正的后台自动化
- 用户需要时可以在记忆页面查看

**可选功能**:
- 在记忆页面可以看到记忆的创建时间
- 可以添加"自动创建"标记（metadata 中添加 `autoCreated: true`）
- 用户可以在设置中查看统计信息（已创建多少自动记忆）

### 7. 异步提取：后台任务

**决策**: 提取过程在后台异步执行，不阻塞 AI 响应

**实现流程**:
```typescript
// 在 TaskAPI.executeTaskStream() 中
await this.conversationManager.addMessage(conversationId, 'assistant', fullResponse);

// 异步触发提取（不等待）
this.triggerExtractionIfNeeded(conversationId).catch(err => {
  console.error('Background extraction failed:', err);
});

// 继续其他逻辑...
```

**理由**:
- 不增加对话延迟
- 提取失败不影响主流程
- 用户体验优先

### 8. 模型选择：使用配置的模型或 Haiku

**决策**: 优先使用用户配置的模型，回退到 Haiku（如果可用）

**理由**:
- 尊重用户的模型选择
- Haiku 成本低、速度快，适合分析任务
- 提取质量对模型要求不高

**实现**:
```typescript
async function extractMemories(messages: Message[]): Promise<MemorySuggestion[]> {
  const config = await loadModelConfig();
  
  // 使用用户配置的模型
  const model = config.modelName || 'claude-haiku-3-5';
  
  // 调用 AI API
  const response = await callAI(model, extractionPrompt);
  
  return parseExtractionResponse(response);
}
```

## Risks / Trade-offs

### 风险 1: AI 提取质量不稳定

**风险**: AI 可能生成低质量或不相关的建议

**缓解措施**:
- 使用置信度阈值过滤（>0.7）
- 限制最多 5 个建议
- 用户审查机制确保质量
- 提供反馈机制改进提示词

### 风险 2: 额外的 AI 调用成本

**风险**: 频繁提取增加 API 调用成本

**缓解措施**:
- 冷却期限制频率（5 分钟）
- 游标机制避免重复分析
- 可配置的触发条件
- 用户可以完全禁用自动提取

### 风险 3: 建议过期或丢失

**风险**: 用户可能忘记处理建议，或建议文件损坏

**缓解措施**:
- 7 天自动过期清理
- 持久化通知提醒
- 建议文件备份机制
- 提供"查看所有建议"入口

### 风险 4: 与现有手动创建冲突

**风险**: 自动建议和手动创建可能产生重复

**缓解措施**:
- 统一的去重检测
- 建议中标记手动创建的记忆
- 用户可以选择忽略建议

### Trade-off: 提取频率 vs 用户打扰

**权衡**: 频繁提取捕获更多信息，但可能打扰用户

**选择**: 默认 5 轮触发 + 可配置，平衡捕获率和用户体验

### Trade-off: 自动化程度 vs 用户控制

**权衡**: 完全自动更方便，但用户失去控制

**选择**: 半自动模式，保持用户控制权，符合记忆系统的设计理念

## Migration Plan

**部署步骤**:
1. 实现后端提取逻辑（MemoryExtractor）
2. 添加 API 端点
3. 实现前端 UI
4. 添加配置选项
5. 默认启用，用户可以禁用

**回滚策略**:
- 功能完全可选，可以通过配置禁用
- 不影响现有记忆系统
- 建议文件独立，删除即可回滚

**数据迁移**:
- 无需迁移现有数据
- 新增配置项有默认值

## Open Questions

1. **提取提示词优化**: 需要根据实际使用情况调整提示词
2. **建议通知位置**: 顶部卡片 vs 侧边栏 vs 浮动按钮？
3. **批量确认行为**: 是否需要二次确认？
4. **建议排序**: 按置信度、类型还是时间排序？

这些问题可以在实现过程中根据用户反馈调整。
