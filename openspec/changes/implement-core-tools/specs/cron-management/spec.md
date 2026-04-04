## ADDED Requirements

### Requirement: 创建定时任务
系统 SHALL 支持创建基于 cron 表达式的定时任务。

#### Scenario: 成功创建任务
- **WHEN** 用户提供有效的 cron 表达式和任务内容
- **THEN** 系统创建任务并返回任务 ID

#### Scenario: 无效的 cron 表达式
- **WHEN** 用户提供无效的 cron 表达式
- **THEN** 系统返回错误，说明表达式格式不正确

#### Scenario: 任务自动执行
- **WHEN** 到达 cron 表达式指定的时间
- **THEN** 系统自动执行任务内容

### Requirement: 删除定时任务
系统 SHALL 支持根据任务 ID 删除定时任务。

#### Scenario: 成功删除任务
- **WHEN** 用户提供有效的任务 ID
- **THEN** 系统停止并删除该任务

#### Scenario: 任务不存在
- **WHEN** 用户提供的任务 ID 不存在
- **THEN** 系统返回错误，说明任务未找到

### Requirement: 列出定时任务
系统 SHALL 支持列出所有活跃的定时任务。

#### Scenario: 列出所有任务
- **WHEN** 用户请求任务列表
- **THEN** 系统返回所有任务的 ID、cron 表达式、创建时间和状态

#### Scenario: 无任务时
- **WHEN** 系统中没有任何定时任务
- **THEN** 返回空列表

### Requirement: 任务持久化
系统 SHALL 在内存中管理定时任务（重启后丢失）。

#### Scenario: 重启后任务丢失
- **WHEN** 系统重启
- **THEN** 所有定时任务被清除，需要重新创建

### Requirement: Cron 表达式格式
系统 SHALL 支持标准的 5 字段 cron 表达式。

#### Scenario: 标准 cron 格式
- **WHEN** 用户提供 5 字段格式（分 时 日 月 周）
- **THEN** 系统正确解析并执行任务
