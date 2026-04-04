## ADDED Requirements

### Requirement: 调用子代理
系统 SHALL 支持创建子代理处理独立的任务。

#### Scenario: 成功调用子代理
- **WHEN** 用户提供任务指令
- **THEN** 系统创建新的 TaskExecutor 实例执行任务并返回结果

#### Scenario: 子代理超时
- **WHEN** 子代理执行时间超过设定的超时时间（默认 5 分钟）
- **THEN** 系统终止子代理并返回超时错误

#### Scenario: 子代理失败
- **WHEN** 子代理执行过程中发生错误
- **THEN** 系统返回错误信息和部分执行结果

### Requirement: 上下文隔离
系统 SHALL 为子代理提供独立的执行上下文。

#### Scenario: 独立上下文
- **WHEN** 子代理被调用
- **THEN** 系统创建新的上下文，不影响主任务的状态

#### Scenario: 共享工作目录
- **WHEN** 子代理需要访问文件
- **THEN** 系统使用与主任务相同的工作目录

### Requirement: 结果返回
系统 SHALL 返回子代理的完整执行结果。

#### Scenario: 返回完整输出
- **WHEN** 子代理执行完成
- **THEN** 系统返回子代理的所有输出内容

#### Scenario: 结果过大
- **WHEN** 子代理输出超过 maxResultSizeChars
- **THEN** 系统自动持久化结果并返回预览

### Requirement: 简化实现
系统 SHALL 实现简化版的子代理，不包含复杂的状态管理。

#### Scenario: 无状态共享
- **WHEN** 子代理执行
- **THEN** 系统不在主任务和子代理之间共享状态
