## 1. 基础架构

- [x] 1.1 创建 `src/channels/types.ts` 定义 ChannelPlugin 和 NotificationMessage 接口
- [x] 1.2 创建 `src/channels/registry.ts` 实现 ChannelRegistry 类
- [x] 1.3 创建 `src/channels/plugins/` 目录结构
- [x] 1.4 创建 `src/notifications/manager.ts` 实现 NotificationManager 类

## 2. 实现内置 Channel 插件

- [ ] 2.1 实现 `src/channels/plugins/console-plugin.ts` - ConsoleChannelPlugin
- [ ] 2.2 实现 `src/channels/plugins/browser-plugin.ts` - BrowserChannelPlugin
- [ ] 2.3 实现 `src/channels/plugins/webchat-plugin.ts` - WebChatChannelPlugin
- [ ] 2.4 创建 `src/channels/plugins/index.ts` 导出所有插件

## 3. 集成到 CronManager

- [ ] 3.1 修改 `src/tools/cron-manager.ts` 添加 setNotificationManager 方法
- [ ] 3.2 修改 cron 任务回调，在触发时调用 notificationManager.notify()
- [ ] 3.3 确保向后兼容，notificationManager 为可选依赖

## 4. 应用初始化

- [ ] 4.1 在 `src/api/task-api.ts` 或 `src/bun/index.ts` 中创建 NotificationManager 实例
- [ ] 4.2 注册 ConsoleNotificationChannel
- [ ] 4.3 注册 BrowserNotificationChannel 并调用 initialize()
- [ ] 4.4 注册 UINotificationChannel（如果事件总线可用）
- [ ] 4.5 将 NotificationManager 注入到 cronManager

## 5. 测试

- [ ] 5.1 创建 `src/__tests__/notification-manager.test.ts` 测试通知管理器
- [ ] 5.2 创建 `src/__tests__/console-channel.test.ts` 测试控制台渠道
- [ ] 5.3 创建 `src/__tests__/browser-channel.test.ts` 测试浏览器渠道
- [ ] 5.4 创建 `src/__tests__/cron-notification.test.ts` 测试 cron 集成
- [ ] 5.5 运行所有测试确保通过

## 6. 端到端验证

- [ ] 6.1 启动应用，创建一个 1 分钟后触发的定时任务
- [ ] 6.2 验证控制台输出通知日志
- [ ] 6.3 验证浏览器系统通知弹出（如果权限已授予）
- [ ] 6.4 验证 UI 通知显示（如果已实现）

## 7. 文档和清理

- [ ] 7.1 更新 `docs/core-tools-guide.md` 添加通知系统说明
- [ ] 7.2 创建 `docs/notification-system.md` 详细文档
- [ ] 7.3 添加代码注释和 JSDoc
- [ ] 7.4 清理调试代码和 console.log
