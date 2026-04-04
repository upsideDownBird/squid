## Context

当前系统已实现定时任务（cron）功能，但触发时只在控制台打印日志，缺少实际的通知机制。用户创建定时任务后无法收到提醒，功能不完整。

现有架构：
- `CronManager` 管理定时任务的创建、删除、列表
- 使用 `node-cron` 库调度任务
- 任务触发时执行回调函数，当前只有 `console.log`
- **聊天框当前通过 HTTP API + SSE (Server-Sent Events) 通信**
  - 后端：`/api/task/execute-stream` 端点，使用 SSE 流式返回
  - 前端：通过 HTTP POST 发送请求，监听 SSE 事件流接收响应

需求：
- 支持多种通知渠道（聊天框、浏览器通知、微信、QQ、Telegram、Discord 等）
- **将聊天框重构为标准的 Channel 插件**，与其他渠道统一管理
- 渠道可插拔，易于扩展，支持第三方渠道插件
- 不同渠道可独立启用/禁用和配置
- 通知系统不仅服务于 cron，未来可用于其他场景（任务完成、错误告警等）
- 渠道系统应该是通用的，支持双向通信（聊天、通知、命令等）

**参考实现：**
- 参考 `openclaw-main` 的 channel 插件架构（见 CLAUDE.md）
- OpenClaw 实现了完整的多渠道抽象，支持 WhatsApp、Telegram、Discord、Slack 等
- 核心设计：插件化架构 + 适配器模式 + 能力声明

**重构目标：**
- 聊天框从独立实现改为 `WebChatChannelPlugin`
- 所有渠道（聊天框、浏览器通知、第三方服务）统一通过 ChannelRegistry 管理
- 聊天框的 HTTP + SSE 通信成为该 channel 的通信机制（outbound/inbound 适配器）
- 为未来支持真正的 WebSocket 或其他协议预留扩展性

## Goals / Non-Goals

**Goals:**
- 设计统一的通知渠道接口，支持多种通知方式
- 实现通知管理器，负责渠道注册和消息路由
- 实现 3 个基础通知渠道（Console、Browser、UI）
- 集成到 CronManager，定时任务触发时发送通知
- 预留第三方渠道（微信、QQ）的扩展接口

**Non-Goals:**
- 不实现微信、QQ 等第三方渠道的完整功能（仅预留接口）
- 不实现通知历史记录和持久化（可作为后续功能）
- 不实现通知优先级和去重机制（v1 保持简单）
- 不实现通知模板系统（直接传递标题和内容）

## Decisions

### 1. Channel 插件架构设计（参考 OpenClaw）

**决策：** 采用插件化的 Channel 架构，**接口设计参考 OpenClaw，但自己实现**

```typescript
// 核心 Channel 插件接口（参考 OpenClaw 设计）
interface ChannelPlugin {
  id: string;                          // 渠道唯一标识
  meta: ChannelMeta;                   // 渠道元信息（名称、描述、图标等）
  capabilities: ChannelCapabilities;   // 能力声明
  
  // 适配器（v1 必须实现的）
  config: ChannelConfigAdapter;        // 配置管理（必须）
  outbound: ChannelOutboundAdapter;    // 出站消息（必须）
  inbound?: ChannelInboundAdapter;     // 入站消息（可选，但建议实现以支持双向通信）
  status: ChannelStatusAdapter;        // 状态检查（必须）
  
  // 适配器（v2 再实现）
  setup?: ChannelSetupAdapter;         // 初始化和设置
  lifecycle?: ChannelLifecycleAdapter; // 生命周期管理
  auth?: ChannelAuthAdapter;           // 认证管理
  // 未来扩展：streaming（流式输出）等
}

// 配置适配器（必须实现）
interface ChannelConfigAdapter {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  getAll(): Record<string, any>;
  validate(): boolean;  // 验证配置是否完整
}

// 能力声明
interface ChannelCapabilities {
  outbound: {
    text: boolean;      // 支持文本消息
    media: boolean;     // 支持媒体消息
    rich: boolean;      // 支持富文本
    streaming: boolean; // 支持流式输出
  };
  inbound: {
    text: boolean;      // 支持接收文本
    commands: boolean;  // 支持命令
    interactive: boolean; // 支持交互式对话
  };
}

// 渠道元信息
interface ChannelMeta {
  name: string;
  description: string;
  icon?: string;
  category: 'builtin' | 'third-party';
}
```

**理由：**
- **可扩展性**：插件化设计，第三方可以轻松添加新渠道
- **能力声明**：明确每个渠道支持什么功能，避免运行时错误
- **适配器模式**：按需实现，简单渠道只需实现 outbound，复杂渠道（如聊天框）需实现 inbound + outbound
- **双向通信**：inbound 适配器支持接收用户输入，聊天框可以实现完整的对话功能
- **配置管理**：config 适配器让每个插件可以管理自己的配置（Webhook URL、API Key 等）
- **状态检查**：status 适配器让系统可以检查渠道是否正常工作
- **参考成熟方案**：OpenClaw 已验证此架构的可行性，我们参考其设计思路
- **独立实现**：不依赖 OpenClaw 代码，完全自主可控

**v1 必须实现的适配器：**
- `config` - 配置管理（否则插件无法配置）
- `outbound` - 发送消息（核心功能）
- `inbound` - 接收消息（可选，但建议实现以支持第三方双向通信插件）
- `status` - 状态检查（否则无法知道渠道是否正常）

**v2 再实现的适配器：**
- `setup` - 初始化和设置
- `lifecycle` - 生命周期管理
- `auth` - 认证管理

**聊天框作为 Channel 的实现：**
```typescript
class WebChatChannelPlugin implements ChannelPlugin {
  id = 'webchat';
  meta = { name: 'Web 聊天框', description: '浏览器内聊天界面', category: 'builtin' };
  capabilities = {
    outbound: { text: true, media: true, rich: true, streaming: true },
    inbound: { text: true, commands: true, interactive: true }
  };
  
  // SSE 长连接管理
  private sseConnections: Set<ReadableStreamDefaultController> = new Set();
  
  registerSSEConnection(controller: ReadableStreamDefaultController) {
    this.sseConnections.add(controller);
  }
  
  unregisterSSEConnection(controller: ReadableStreamDefaultController) {
    this.sseConnections.delete(controller);
  }
  
  outbound = {
    async sendText(params) {
      // 通过 SSE 发送消息到前端聊天框
      // 可以是流式输出（现有的 execute-stream）
      // 也可以是独立的通知消息
    },
    
    async sendNotification(params) {
      // 推送通知到所有活跃的 SSE 连接
      const message = `data: ${JSON.stringify({
        type: 'notification',
        title: params.title,
        content: params.content,
        timestamp: new Date().toISOString()
      })}\n\n`;
      
      for (const controller of this.sseConnections) {
        try {
          controller.enqueue(new TextEncoder().encode(message));
        } catch (err) {
          // 连接已断开，移除
          this.sseConnections.delete(controller);
        }
      }
    }
  };
  
  inbound = {
    onMessage(callback) {
      // 监听 HTTP POST 请求（现有的 /api/task/execute）
      // 接收用户输入并回调
    }
  };
}
```

**通信机制说明：**
- **Outbound（发送）**：
  - 流式输出：复用现有的 `/api/task/execute-stream` SSE 端点（短连接，任务执行期间）
  - 通知消息：新增 `/api/notifications/stream` SSE 端点（**长连接**，页面加载时建立）
  - 长连接用于推送独立的通知、系统消息、定时任务提醒等
  
- **Inbound（接收）**：
  - 用户输入：复用现有的 `/api/task/execute` HTTP POST 端点
  - 前端发送消息 → 后端接收 → 触发 inbound 回调

- **SSE 长连接特点**：
  - 前端页面加载时建立连接：`new EventSource('/api/notifications/stream')`
  - 后端保持连接打开，定期发送心跳保持活跃
  - 可以随时推送通知到聊天框，无需等待用户发起请求
  - 连接断开时自动清理

- **与 BrowserChannelPlugin 的区别**：
  - WebChatChannelPlugin：需要页面打开（SSE 连接存在），消息显示在聊天框内，支持富文本和历史记录
  - BrowserChannelPlugin：不需要页面打开，系统级通知弹窗，简单文本，自动消失

- **未来扩展**：
  - 可以升级为真正的 WebSocket 双向通信
  - 插件架构支持无缝切换通信协议
```

**理由：**
- **可扩展性**：插件化设计，第三方可以轻松添加新渠道
- **能力声明**：明确每个渠道支持什么功能，避免运行时错误
- **适配器模式**：按需实现，简单渠道只需实现 outbound，复杂渠道可实现更多
- **未来兼容**：预留 inbound、auth 等适配器，支持双向通信和认证
- **参考成熟方案**：OpenClaw 已验证此架构的可行性

**替代方案：**
- 简单接口（原设计）：不够灵活，难以扩展
- 事件驱动架构：过于复杂，不适合当前需求

### 2. Channel 注册和管理

**决策：** 使用 ChannelRegistry 管理所有渠道插件

```typescript
class ChannelRegistry {
  private channels: Map<string, ChannelPlugin>;
  
  register(plugin: ChannelPlugin): void;
  unregister(channelId: string): void;
  get(channelId: string): ChannelPlugin | undefined;
  list(): ChannelPlugin[];
  listByCapability(capability: keyof ChannelCapabilities): ChannelPlugin[];
}
```

**理由：**
- 集中管理所有渠道
- 支持按能力查询（例如：查找所有支持文本通知的渠道）
- 支持动态注册/注销（插件市场）
- 类型安全

### 3. 通知消息格式

**决策：** 定义标准化的消息结构

```typescript
interface NotificationMessage {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

**理由：**
- `id` 用于追踪和去重（未来功能）
- `type` 支持不同样式的通知
- `metadata` 提供扩展性，可携带任务 ID、来源等信息
- 结构简单，所有渠道都能理解

### 4. 通知管理器架构

**决策：** NotificationManager 作为通知路由层

```typescript
class NotificationManager {
  constructor(private registry: ChannelRegistry) {}
  
  async notify(message: NotificationMessage, options?: {
    channels?: string[];  // 指定渠道，不指定则广播到所有启用的渠道
    filter?: (plugin: ChannelPlugin) => boolean;
  }): Promise<NotificationResult[]>;
}

interface NotificationResult {
  channelId: string;
  success: boolean;
  error?: string;
}
```

**理由：**
- 分离关注点：Registry 管理插件，Manager 负责路由
- 支持广播和定向发送
- 支持自定义过滤器（例如：只发送到支持富文本的渠道）
- 异步并发发送，提高性能

### 5. 内置渠道实现

**决策：** 实现 3-4 个基础渠道插件

1. **WebChatChannelPlugin** - Web 聊天框（重构现有实现）
   - 支持双向通信（inbound + outbound）
   - 通过 HTTP + SSE (Server-Sent Events) 通信
   - **新增 SSE 长连接**：`/api/notifications/stream`，用于推送通知
   - 支持流式输出、富文本、交互式对话
   - 复用现有的 `/api/task/execute-stream` 端点（任务执行）
   
2. **ConsoleChannelPlugin** - 控制台输出（调试用）
   - 仅 outbound
   - 简单的文本输出
   
3. **BrowserChannelPlugin** - 浏览器系统通知
   - 仅 outbound
   - 使用浏览器 Notification API
   - 不依赖页面打开状态（只要浏览器运行即可）
   
4. **（可选）UIToastChannelPlugin** - 应用内 Toast 通知
   - 仅 outbound
   - 轻量级通知提示

**理由：**
- **WebChat 是核心渠道**：重构现有聊天框，成为标准 channel 插件
- Console 用于调试和开发
- Browser 提供系统级通知，即使应用未打开也能提醒
- Toast 提供轻量级应用内提示（可选）
- 四者覆盖不同使用场景和优先级

**WebChatChannelPlugin vs BrowserChannelPlugin：**

| 特性 | WebChatChannelPlugin | BrowserChannelPlugin |
|------|---------------------|---------------------|
| 连接方式 | SSE 长连接 | 浏览器 Notification API |
| 展示位置 | 聊天框内 | 操作系统通知栏 |
| 是否需要应用打开 | 是（需要页面加载） | 否（浏览器打开即可） |
| 消息持久化 | 是（聊天历史） | 否（自动消失） |
| 富文本支持 | 是 | 否 |
| 需要权限 | 否 | 是 |

**WebChatChannelPlugin 重构要点：**
- 新增 `/api/notifications/stream` SSE 长连接端点
  - 前端页面加载时建立：`new EventSource('/api/notifications/stream')`
  - 后端保持连接打开，定期发送心跳
  - 可以随时推送通知到聊天框
- outbound 适配器：
  - 发送 AI 回复（流式）：复用 `/api/task/execute-stream`
  - 发送通知消息：通过 SSE 长连接推送
- inbound 适配器：接收用户输入（复用 `/api/task/execute`）
- 保持现有功能不变，只是架构重构
- 未来可以升级为 WebSocket 通信，插件架构支持无缝切换

**实际使用示例：**
```typescript
// 定时任务触发时，同时发送到两个渠道
await notificationManager.notify({
  title: '定时任务提醒',
  content: '该开会了！',
  type: 'info'
}, {
  channels: ['webchat', 'browser']
});
```
- WebChatChannelPlugin：通过 SSE 长连接推送到聊天框
- BrowserChannelPlugin：弹出系统通知
- 如果用户未打开应用，WebChat 发送失败，但 Browser 仍可提醒

### 6. 第三方渠道扩展

**决策：** 定义清晰的扩展接口，**参考 OpenClaw 的实现自己开发**

**策略：**
- 我们的 `ChannelPlugin` 接口参考 OpenClaw 设计，保持核心概念一致
- **不依赖 OpenClaw 代码**，而是参考其实现思路，自己实现一遍
- 接口兼容，如果用户想用 OpenClaw 的插件，可以自己写适配器
- 优先实现国内常用的渠道（飞书、钉钉、企业微信）

**参考 OpenClaw 实现的渠道（自己开发）：**
1. **飞书** - 参考 `openclaw-main/extensions/feishu/`
   - Webhook 机器人（简单）
   - 飞书应用（支持双向通信）
2. **钉钉** - 参考类似实现
   - 钉钉机器人 Webhook
3. **企业微信** - 参考类似实现
   - 企业微信机器人 Webhook
4. **Telegram** - 参考 `openclaw-main/extensions/telegram/`
   - Telegram Bot API
5. **Discord** - 参考 `openclaw-main/extensions/discord/`
   - Discord Webhook 或 Bot
6. **Slack** - 参考 `openclaw-main/extensions/slack/`
   - Slack Webhook 或 App

**飞书插件实现示例（自己开发）：**
```typescript
// 参考 OpenClaw 的设计，但自己实现
class FeishuChannelPlugin implements ChannelPlugin {
  id = 'feishu';
  meta = {
    name: '飞书',
    description: '通过飞书机器人发送通知',
    category: 'third-party'
  };
  
  capabilities = {
    outbound: { text: true, media: true, rich: true, streaming: false },
    inbound: { text: false, commands: false, interactive: false }  // v1 仅支持发送
  };
  
  // 配置
  private config = {
    webhookUrl: '',
    enabled: false
  };
  
  // 出站适配器：发送消息到飞书
  outbound = {
    async sendText(params: { content: string; title?: string }) {
      if (!this.config.webhookUrl) {
        throw new Error('飞书 Webhook URL 未配置');
      }
      
      // 参考飞书 API 文档实现
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg_type: 'text',
          content: {
            text: params.content
          }
        })
      });
      
      return { success: response.ok };
    },
    
    async sendNotification(params: NotificationMessage) {
      // 发送飞书卡片消息（参考飞书 API 文档）
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg_type: 'interactive',
          card: {
            header: {
              title: {
                tag: 'plain_text',
                content: params.title
              },
              template: this.getCardColor(params.type)
            },
            elements: [
              {
                tag: 'div',
                text: {
                  tag: 'plain_text',
                  content: params.content
                }
              }
            ]
          }
        })
      });
      
      return { success: response.ok };
    }
  };
  
  // 状态检查
  status = {
    async check() {
      if (!this.config.webhookUrl) {
        return { healthy: false, message: 'Webhook URL 未配置' };
      }
      
      try {
        const response = await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            msg_type: 'text',
            content: { text: '连接测试' }
          })
        });
        
        return {
          healthy: response.ok,
          message: response.ok ? '连接正常' : '连接失败'
        };
      } catch (error) {
        return { healthy: false, message: `连接错误: ${error.message}` };
      }
    }
  };
  
  private getCardColor(type: string): string {
    const colors = {
      'info': 'blue',
      'success': 'green',
      'warning': 'orange',
      'error': 'red'
    };
    return colors[type] || 'blue';
  }
}
```

**理由：**
- **独立性**：不依赖 OpenClaw，系统完全独立
- **学习最佳实践**：参考 OpenClaw 的成熟实现，学习其设计思路
- **接口兼容**：保持接口概念一致，便于理解和扩展
- **灵活性**：可以根据自己的需求调整实现细节
- **维护性**：不受 OpenClaw 更新影响，完全自主可控

**实施步骤：**
1. 研究 OpenClaw 的 channel 插件接口和实现思路
2. 参考其设计，定义我们自己的 `ChannelPlugin` 接口
3. 参考飞书插件实现，自己开发 `FeishuChannelPlugin`
4. 测试功能，确保正常工作
5. 逐步实现其他第三方渠道（钉钉、企业微信等）

**无需依赖：**
- 不需要引入 OpenClaw 的代码
- 不需要运行 OpenClaw
- 只是参考其设计思路和 API 调用方式

### 7. 与 CronManager 集成方式

**决策：** 通过依赖注入传递 NotificationManager

```typescript
class CronManager {
  private notificationManager?: NotificationManager;
  
  setNotificationManager(manager: NotificationManager) {
    this.notificationManager = manager;
  }
}
```

**理由：**
- 松耦合，CronManager 不依赖具体通知实现
- 可选依赖，不影响现有功能
- 便于测试（可注入 mock）

**替代方案：**
- 直接导入：紧耦合，不利于测试
- 事件总线：过度设计

## Risks / Trade-offs

### 风险 1: 浏览器通知权限被拒绝
**影响：** BrowserChannelPlugin 无法工作  
**缓解：** 
- 在 UI 中提示用户授权
- 降级到 UI 通知渠道
- 在设置页面提供重新请求权限的入口

### 风险 2: 通知过多导致骚扰
**影响：** 用户体验下降  
**缓解：**
- v1 不实现去重，由用户控制定时任务数量
- 未来可添加通知频率限制和去重机制

### 风险 3: 聊天框重构为 Channel 的兼容性
**影响：** 现有聊天框功能可能受影响  
**缓解：**
- 采用渐进式重构，保持现有 API 不变
- 先封装现有 WebSocket 逻辑到 channel 插件
- 前端界面保持不变，只是后端架构调整
- 充分测试，确保所有现有功能正常工作

### 风险 4: Channel 插件架构过度设计
**影响：** 实现复杂度增加，开发周期延长  
**缓解：**
- v1 实现核心适配器（outbound、inbound、status、config）
- **必须实现 inbound**：否则第三方插件无法实现双向通信（如聊天机器人）
- **必须实现 config**：否则插件无法配置（Webhook URL、API Key 等）
- lifecycle 和 auth 适配器可以 v2 再实现
- 内置渠道先实现简单功能，复杂功能留给第三方插件
- **参考 OpenClaw 设计**：学习其最佳实践，避免重复踩坑

### 风险 5: 第三方渠道 API 变更
**影响：** 飞书、钉钉等第三方平台 API 可能变更，导致插件失效  
**缓解：**
- 使用官方 SDK（如果有）
- 关注官方文档和变更通知
- 插件化设计便于快速修复和更新
- 添加版本兼容性检查

### Trade-off 1: 同步 vs 异步发送
**选择：** 异步并发发送  
**代价：** 无法保证发送顺序，错误处理复杂  
**收益：** 性能更好，不阻塞主流程

### Trade-off 2: 通知持久化
**选择：** v1 不持久化  
**代价：** 重启后通知历史丢失  
**收益：** 实现简单，减少存储开销

### Trade-off 3: 简单接口 vs 插件架构
**选择：** 插件架构（参考 OpenClaw）  
**代价：** 初期实现复杂度更高  
**收益：** 长期可扩展性强，支持第三方插件和插件市场

### Trade-off 4: 自研插件 vs 参考 OpenClaw
**选择：** 参考 OpenClaw 设计，自己实现  
**代价：** 需要自己开发所有插件，工作量较大  
**收益：** 完全独立，不依赖外部项目，自主可控，可根据需求定制

## Migration Plan

**部署步骤：**
1. 研究 OpenClaw 的 channel 插件接口和实现思路
2. 创建 Channel 插件系统基础架构（types, registry）
3. 实现 NotificationManager（通知路由层）
4. 新增 `/api/notifications/stream` SSE 长连接端点
5. 实现 ConsoleChannelPlugin 和 BrowserChannelPlugin
6. 重构聊天框为 WebChatChannelPlugin
   - 封装 SSE 长连接管理
   - 实现 outbound/inbound 适配器
   - 前端添加 EventSource 监听
7. 参考 OpenClaw 实现，开发飞书插件（FeishuChannelPlugin）
   - 参考飞书 API 文档
   - 实现 Webhook 机器人功能
   - 测试功能
8. 修改 CronManager 集成通知系统
9. 在应用初始化时注册内置渠道
10. 测试定时任务通知功能
11. 逐步开发其他第三方插件（钉钉、企业微信、Telegram 等）
12. 部署到生产环境

**向后兼容性：**
- 完全兼容，现有 API 不变
- 现有的 `/api/task/execute` 和 `/api/task/execute-stream` 保持不变
- 新增的 `/api/notifications/stream` 是额外的端点
- CronManager 的 `notificationManager` 是可选的，不影响现有功能

**回滚策略：**
- 如果通知系统有问题，可以不调用 `setNotificationManager`
- CronManager 会回退到原有的 console.log 行为
- 前端如果无法连接 `/api/notifications/stream`，降级为仅使用 Browser 通知
- 第三方插件失败不影响内置渠道的使用

## Open Questions

1. **聊天框重构的范围？**
   - 是否需要在 v1 完成聊天框到 WebChatChannelPlugin 的完整重构？
   - 还是先实现 Channel 架构和其他渠道，聊天框重构作为 v2？
   - **建议：** v1 先实现 SSE 长连接和基础的通知推送，完整重构作为 v1.5

2. **SSE 长连接的心跳间隔？**
   - 多久发送一次心跳保持连接活跃？
   - **建议：** 30 秒（参考业界标准）

3. **是否需要通知配置持久化？**
   - 当前设计中渠道启用状态在内存中
   - 是否需要保存到配置文件？
   - **建议：** v1 不持久化，使用默认配置

4. **通知失败是否需要重试？**
   - 当前设计不重试
   - 是否需要添加重试机制？
   - **建议：** v1 不重试，记录错误日志即可

5. **是否需要立即实现 Channel 插件市场？**
   - 插件架构已支持第三方扩展
   - 是否需要在 v1 实现插件发现、安装、更新机制？
   - **建议：** v1 仅支持手动注册插件，插件市场作为后续功能（参考 OpenClaw 的 skill 市场实现）

6. **前端如何处理多个 SSE 连接？**
   - 任务执行的 SSE（`/api/task/execute-stream`）
   - 通知推送的 SSE（`/api/notifications/stream`）
   - 是否需要合并为一个连接？
   - **建议：** v1 保持两个独立连接，职责清晰；未来可以考虑合并或升级为 WebSocket

7. **OpenClaw 插件的依赖管理？**
   - ~~如何引入 OpenClaw 的代码？~~
   - ~~选项 A: npm 依赖（如果 OpenClaw 发布了包）~~
   - ~~选项 B: git submodule 引用 openclaw-main~~
   - ~~选项 C: 直接复制需要的插件代码到项目中~~
   - **已确定：** 不依赖 OpenClaw，参考其设计自己实现

8. **优先实现哪些第三方渠道？**
   - 飞书、钉钉、企业微信（国内常用）
   - Telegram、Discord、Slack（国际常用）
   - **建议：** v1 先实现飞书，验证插件架构；v2 逐步添加其他渠道

9. **第三方渠道的配置如何管理？**
   - 每个插件有自己的配置（Webhook URL、API Key 等）
   - 是否需要统一的配置文件？
   - **建议：** v1 通过代码配置，v2 考虑配置文件或 UI 配置界面
