## Why

定时任务（cron）已经实现并能正常触发，但触发时只在控制台打印日志，没有实际的通知机制。用户无法收到提醒，导致定时任务功能不完整。同时，未来可能需要在多个场景（UI、微信、QQ、Telegram、Discord、邮件等）发送通知，需要一个统一、可扩展的通知系统架构。

**设计参考：** 本提案参考 OpenClaw 的 Channel 插件架构（见 `openclaw-main/src/channels/plugins/`），采用插件化设计，支持第三方渠道扩展和未来的插件市场。

**核心策略：** 
- **参考 OpenClaw 设计，自己实现**：学习其成熟的架构和最佳实践
- 不依赖 OpenClaw 代码，保持系统完全独立和自主可控
- 接口设计保持核心概念一致，便于理解和扩展
- 参考其飞书、Telegram、Discord 等插件的实现思路

**现有基础：** 聊天框已通过 HTTP + SSE 与后端连接，可重构为标准的 WebChatChannelPlugin。

## What Changes

- 新增 **Channel 插件系统**，定义统一的渠道插件接口和能力声明机制（**参考 OpenClaw 设计**）
- 新增 `ChannelRegistry` 管理所有渠道插件的注册、查询和生命周期
- 新增 `NotificationManager` 管理器，负责通知路由和多渠道广播
- 实现 3 个内置 Channel 插件：
  - `ConsoleChannelPlugin` - 控制台输出（调试用）
  - `BrowserChannelPlugin` - 浏览器系统通知
  - `WebChatChannelPlugin` - Web 聊天框（重构现有实现，新增 SSE 长连接）
- **参考 OpenClaw 实现第三方渠道插件**（自己开发）：
  - 飞书、钉钉、企业微信
  - Telegram、Discord、Slack
  - 其他第三方渠道
- 新增 `/api/notifications/stream` SSE 长连接端点，用于推送通知到聊天框
- 修改 `CronManager` 集成通知系统，定时任务触发时发送通知
- 支持渠道的动态启用/禁用和配置管理
- 为未来的 Channel 插件市场奠定基础

## Capabilities

### New Capabilities
- `channel-plugin-system`: Channel 插件系统核心，包括插件接口、能力声明、适配器模式（**参考 OpenClaw 设计**）
- `channel-registry`: 渠道注册表，管理所有渠道插件的注册和查询
- `notification-manager`: 通知管理器，负责通知路由和多渠道广播
- `builtin-channel-plugins`: 内置渠道插件实现（Console、Browser、WebChat）
- `third-party-channel-plugins`: 第三方渠道插件实现（飞书、钉钉、Telegram 等，参考 OpenClaw 自己开发）
- `sse-notification-stream`: SSE 长连接端点，用于推送通知到聊天框
- `cron-notification-integration`: 将通知系统集成到定时任务管理器中

### Modified Capabilities
- `cron-task-management`: 定时任务触发时的行为从仅打印日志改为通过通知系统发送通知
- `webchat-communication`: 聊天框通信机制，新增 SSE 长连接支持

## Impact

**受影响的代码：**
- `src/tools/cron-manager.ts` - 需要集成通知管理器
- `src/bun/index.ts` 或应用初始化代码 - 注册内置渠道插件，新增 SSE 端点

**新增代码：**
- `src/channels/types.ts` - Channel 插件接口定义（参考 OpenClaw）
- `src/channels/registry.ts` - 渠道注册表
- `src/channels/plugins/` - 各种渠道插件实现
  - `console-plugin.ts`
  - `browser-plugin.ts`
  - `webchat-plugin.ts`
  - `feishu-plugin.ts` - 飞书插件（参考 OpenClaw 实现）
  - 其他第三方渠道插件
- `src/notifications/manager.ts` - 通知管理器
- `src/notifications/types.ts` - 通知消息类型定义

**依赖：**
- 无新增外部依赖（内置渠道）
- 使用浏览器原生 Notification API
- 第三方渠道插件可能需要各自的 SDK（如飞书 SDK）

**向后兼容性：**
- 完全向后兼容，现有功能不受影响
- 定时任务行为增强，不破坏现有 API
- 新增的 `/api/notifications/stream` 是额外的端点

**未来扩展：**
- 支持第三方开发者创建自定义 Channel 插件
- 可建立 Channel 插件市场（参考 OpenClaw 的 skill 市场）
- 支持双向通信（inbound 适配器）和认证（auth 适配器）
- 逐步实现更多第三方渠道
