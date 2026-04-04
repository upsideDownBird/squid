## ADDED Requirements

### Requirement: PowerShell 命令执行
系统 SHALL 支持在 Windows 平台执行 PowerShell 命令。

#### Scenario: 成功执行 PowerShell 命令
- **WHEN** 用户在 Windows 系统上提供有效的 PowerShell 命令
- **THEN** 系统执行命令并返回输出结果

#### Scenario: 非 Windows 平台
- **WHEN** 用户在非 Windows 平台尝试使用 PowerShellTool
- **THEN** 系统返回错误，说明该工具仅支持 Windows

#### Scenario: 命令超时
- **WHEN** PowerShell 命令执行时间超过设定的超时时间
- **THEN** 系统终止命令并返回超时错误

### Requirement: 后台执行
系统 SHALL 支持在后台执行 PowerShell 命令。

#### Scenario: 后台执行
- **WHEN** 用户设置 run_in_background=true
- **THEN** 系统立即返回任务 ID，命令在后台继续执行

### Requirement: 安全性标记
系统 SHALL 将 PowerShellTool 标记为破坏性工具。

#### Scenario: 破坏性标记
- **WHEN** 系统检查工具属性
- **THEN** isDestructive() 返回 true
