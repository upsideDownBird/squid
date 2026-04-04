## ADDED Requirements

### Requirement: 系统应提供简单的事件总线
系统 SHALL 提供基于 EventEmitter 的事件总线，连接引擎和 channel。

#### Scenario: 发布任务完成事件
- **WHEN** 任务执行完成
- **THEN** 引擎调用 eventBridge.notifyTaskComplete
- **AND** 所有订阅的 channel 收到事件

#### Scenario: Channel 订阅事件
- **WHEN** channel 调用 eventBridge.onTaskComplete
- **THEN** 注册回调函数
- **AND** 任务完成时触发回调

#### Scenario: Channel 发送命令
- **WHEN** channel 调用 eventBridge.sendCommand
- **THEN** 发布命令事件
- **AND** 引擎订阅者收到命令

#### Scenario: 引擎订阅命令
- **WHEN** 引擎调用 eventBridge.onCommand
- **THEN** 注册回调函数
- **AND** channel 发送命令时触发回调

### Requirement: 事件总线应支持多个订阅者
系统 SHALL 支持多个 channel 同时订阅同一事件。

#### Scenario: 多个 channel 订阅
- **WHEN** 多个 channel 订阅任务完成事件
- **THEN** 任务完成时所有 channel 都收到通知
- **AND** 各 channel 独立处理

#### Scenario: 订阅者处理失败不影响其他订阅者
- **WHEN** 某个 channel 处理事件时抛出异常
- **THEN** 其他 channel 仍然收到事件
- **AND** 记录错误日志

### Requirement: 事件总线应提供全局单例
系统 SHALL 提供全局单例 eventBridge 供所有模块使用。

#### Scenario: 导入全局单例
- **WHEN** 模块导入 eventBridge
- **THEN** 获得同一个实例
- **AND** 可以发布和订阅事件
