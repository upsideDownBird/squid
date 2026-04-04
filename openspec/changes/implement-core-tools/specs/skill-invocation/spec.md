## ADDED Requirements

### Requirement: 调用技能
系统 SHALL 支持通过技能名称调用已注册的技能。

#### Scenario: 成功调用技能
- **WHEN** 用户提供有效的技能名称和参数
- **THEN** 系统加载并执行该技能，返回执行结果

#### Scenario: 技能不存在
- **WHEN** 用户提供的技能名称不存在
- **THEN** 系统返回错误，说明技能未找到

#### Scenario: 技能参数错误
- **WHEN** 用户提供的参数不符合技能要求
- **THEN** 系统返回错误，说明参数格式不正确

### Requirement: 技能列表
系统 SHALL 支持列出所有可用的技能。

#### Scenario: 列出技能
- **WHEN** 用户请求技能列表
- **THEN** 系统返回所有技能的名称、描述和参数说明

### Requirement: 技能执行上下文
系统 SHALL 为技能提供执行上下文（工作目录、任务 ID 等）。

#### Scenario: 传递上下文
- **WHEN** 技能被调用
- **THEN** 系统传递当前的工作目录和任务 ID 给技能

### Requirement: 集成现有 SkillLoader
系统 SHALL 使用项目现有的 SkillLoader 加载技能。

#### Scenario: 复用 SkillLoader
- **WHEN** SkillTool 初始化
- **THEN** 系统使用 SkillLoader 实例加载技能定义
