## ADDED Requirements

### Requirement: 任务执行应在完成时发送事件
系统 SHALL 在后台任务完成时通过 EventBridge 发送事件。

#### Scenario: 后台任务成功完成
- **WHEN** 后台任务执行成功
- **THEN** 调用 eventBridge.notifyTaskComplete
- **AND** 包含任务 ID 和执行结果

#### Scenario: 后台任务执行失败
- **WHEN** 后台任务执行失败
- **THEN** 调用 eventBridge.notifyTaskComplete
- **AND** 包含任务 ID 和错误信息

#### Scenario: 事件包含完整信息
- **WHEN** 发送任务完成事件
- **THEN** 事件包含任务 ID、名称、结果、耗时等信息
- **AND** channel 可以根据这些信息显示通知
