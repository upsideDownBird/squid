## ADDED Requirements

### Requirement: 系统应将聊天框实现为 WebUI Channel 插件
系统 SHALL 将聊天框改造为 WebUIChannelPlugin，使用 WebSocket 与引擎通信。

#### Scenario: 启动 WebSocket 服务器
- **WHEN** WebUIChannelPlugin 初始化
- **THEN** 启动 WebSocket 服务器
- **AND** 监听指定端口

#### Scenario: 接收任务完成通知
- **WHEN** 引擎发布任务完成事件
- **THEN** WebUIChannelPlugin 收到事件
- **AND** 通过 WebSocket 推送到所有客户端

#### Scenario: 接收客户端消息
- **WHEN** 客户端通过 WebSocket 发送消息
- **THEN** WebUIChannelPlugin 接收消息
- **AND** 根据消息类型处理（如发送命令到引擎）

### Requirement: 系统应支持 WebSocket 连接管理
系统 SHALL 管理 WebSocket 客户端连接。

#### Scenario: 客户端连接
- **WHEN** 客户端建立 WebSocket 连接
- **THEN** 服务器接受连接
- **AND** 将客户端加入连接列表

#### Scenario: 客户端断开
- **WHEN** 客户端断开连接
- **THEN** 服务器移除该客户端
- **AND** 清理相关资源

#### Scenario: 广播消息
- **WHEN** 调用 broadcast 方法
- **THEN** 消息发送到所有已连接的客户端
- **AND** 断开的客户端自动跳过

### Requirement: 系统应支持心跳检测
系统 SHALL 实现心跳检测，保持连接活跃。

#### Scenario: 发送心跳
- **WHEN** 定期发送心跳消息
- **THEN** 客户端响应心跳
- **AND** 保持连接活跃

#### Scenario: 心跳超时
- **WHEN** 客户端未响应心跳
- **THEN** 服务器关闭该连接
- **AND** 清理资源

### Requirement: 前端应实现 WebSocket 客户端
系统 SHALL 在前端实现 WebSocket 客户端，连接到服务器。

#### Scenario: 建立连接
- **WHEN** 页面加载
- **THEN** 自动连接到 WebSocket 服务器
- **AND** 连接成功后可以收发消息

#### Scenario: 自动重连
- **WHEN** 连接断开
- **THEN** 自动尝试重连
- **AND** 使用指数退避策略

#### Scenario: 接收任务通知
- **WHEN** 收到任务完成消息
- **THEN** 在聊天界面显示通知
- **AND** 包含任务 ID 和结果

#### Scenario: 发送命令
- **WHEN** 用户在聊天框输入命令
- **THEN** 通过 WebSocket 发送到服务器
- **AND** 服务器转发到引擎
