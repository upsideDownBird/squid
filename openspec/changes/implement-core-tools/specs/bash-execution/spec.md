## ADDED Requirements

### Requirement: 命令执行
系统 SHALL 支持执行 Bash 命令并返回输出结果。

#### Scenario: 成功执行命令
- **WHEN** 用户提供有效的 Bash 命令
- **THEN** 系统执行命令并返回 stdout 和 stderr

#### Scenario: 命令执行失败
- **WHEN** 命令执行返回非零退出码
- **THEN** 系统返回错误信息和退出码

#### Scenario: 命令超时
- **WHEN** 命令执行时间超过设定的超时时间（默认 30 秒）
- **THEN** 系统终止命令并返回超时错误

### Requirement: 后台执行
系统 SHALL 支持在后台执行长时间运行的命令。

#### Scenario: 后台执行命令
- **WHEN** 用户设置 run_in_background=true
- **THEN** 系统立即返回任务 ID，命令在后台继续执行

#### Scenario: 查询后台任务状态
- **WHEN** 用户使用任务 ID 查询状态
- **THEN** 系统返回任务的执行状态和输出

### Requirement: 工作目录
系统 SHALL 支持指定命令的工作目录。

#### Scenario: 指定工作目录
- **WHEN** 用户提供 working_directory 参数
- **THEN** 系统在指定目录下执行命令

#### Scenario: 默认工作目录
- **WHEN** 用户未指定工作目录
- **THEN** 系统使用当前项目根目录作为工作目录

### Requirement: 安全性标记
系统 SHALL 将 BashTool 标记为破坏性工具。

#### Scenario: 破坏性标记
- **WHEN** 系统检查工具属性
- **THEN** isDestructive() 返回 true
