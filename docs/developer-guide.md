# Jobopx Desktop 开发者文档

## 架构设计

### 核心模块

```
src/
├── tasks/           # 任务管理
│   ├── state-machine.ts      # 状态机（ask/craft/plan）
│   └── context-compressor.ts # 上下文压缩
├── tools/           # 工具系统
│   ├── base.ts              # 工具类型定义
│   ├── read-file.ts         # 文件读取
│   ├── write-file.ts        # 文件写入
│   ├── glob.ts              # 文件匹配
│   └── grep.ts              # 内容搜索
├── models/          # AI 模型
│   ├── types.ts             # 接口定义
│   ├── anthropic.ts         # Anthropic 适配器
│   ├── openai.ts            # OpenAI 适配器
│   ├── deepseek.ts          # DeepSeek 适配器
│   └── registry.ts          # 模型注册表
├── workspace/       # 工作空间
│   ├── manager.ts           # 目录管理
│   └── sandbox.ts           # 路径沙箱
├── permissions/     # 权限系统
│   ├── engine.ts            # 规则引擎
│   └── classifier.ts        # 工具分类
├── skills/          # 技能系统
│   ├── loader.ts            # 技能加载
│   └── validator.ts         # 权限验证
├── experts/         # 专家系统
│   └── manager.ts           # 专家管理
├── mcp/             # MCP 集成
│   ├── client.ts            # MCP 客户端
│   ├── connection-manager.ts # 连接管理
│   └── tool-adapter.ts      # 工具适配
├── claw/            # 远程控制
│   ├── server.ts            # HTTP 服务器
│   └── task-handler.ts      # 任务处理
├── scheduler/       # 定时任务
│   ├── cron-scheduler.ts    # Cron 调度
│   └── task-scheduler.ts    # 任务调度
└── ui/              # 用户界面
    ├── main-layout.tsx      # 主布局
    └── task-wizard.tsx      # 任务向导
```

### 设计原则

1. **类型安全**：使用 TypeScript + Zod 确保类型安全
2. **不可变性**：使用 DeepImmutable 约束上下文
3. **模块化**：每个模块职责单一，接口清晰
4. **可扩展**：通过注册表模式支持扩展

### 工具系统

工具采用类型定义而非类继承：

```typescript
export type Tool<Input, Output> = {
  name: string;
  description: string;
  inputSchema: z.ZodType<Input>;
  maxResultSizeChars: number;
  call(input: Input, context: ToolContext): Promise<ToolResult<Output>>;
  isConcurrencySafe(input: Input): boolean;
  isReadOnly(input: Input): boolean;
  isDestructive?(input: Input): boolean;
};
```

### 模型适配器

所有模型提供者实现统一接口：

```typescript
export interface ModelProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  streamChat(request: ChatRequest): AsyncIterable<ChatChunk>;
}
```

## 扩展指南

### 添加新工具

1. 在 `src/tools/` 创建工具文件
2. 定义输入 Schema（使用 Zod）
3. 实现 Tool 类型
4. 在工具注册表中注册

示例：

```typescript
import { z } from 'zod';
import type { Tool, ToolContext, ToolResult } from './base';

const MyToolInputSchema = z.object({
  param: z.string()
});

export const MyTool: Tool<typeof MyToolInputSchema, string> = {
  name: 'my_tool',
  description: '工具描述',
  inputSchema: MyToolInputSchema,
  maxResultSizeChars: 10000,
  async call(input, context) {
    // 实现逻辑
    return { data: 'result' };
  },
  isConcurrencySafe: () => true,
  isReadOnly: () => true
};
```

### 添加新模型提供者

1. 在 `src/models/` 创建适配器文件
2. 实现 ModelProvider 接口
3. 在 ModelRegistry 中注册

示例：

```typescript
import type { ModelProvider, ChatRequest, ChatResponse } from './types';

export class MyModelProvider implements ModelProvider {
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // 调用模型 API
    return { content: 'response' };
  }

  async *streamChat(request: ChatRequest) {
    // 流式响应
    yield { content: 'chunk' };
  }
}
```

### 添加新技能

1. 在 `skills/` 目录创建 Markdown 文件
2. 添加 YAML frontmatter
3. 编写系统提示词

示例：

```markdown
---
name: my-skill
description: 技能描述
allowed-tools:
  - read_file
  - write_file
---

你是一个专业的助手，擅长...
```

### 添加新专家

在 `src/experts/types.ts` 中添加专家定义：

```typescript
export const myExpert: ExpertRole = {
  id: 'my-expert',
  name: '专家名称',
  description: '专家描述',
  systemPrompt: '你是一个...'
};
```

### 添加 MCP 连接器

在 `src/mcp/built-in-connectors.ts` 中添加配置：

```typescript
{
  name: 'my-service',
  command: 'npx',
  args: ['-y', 'mcp-server-my-service'],
  env: {
    API_KEY: process.env.MY_SERVICE_API_KEY || ''
  }
}
```

## 测试

```bash
# 运行单元测试
npm test

# 运行集成测试
npm run test:integration

# 代码覆盖率
npm run test:coverage
```

## 构建和发布

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 打包桌面应用
npm run package
```

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
