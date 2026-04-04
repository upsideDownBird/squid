## ADDED Requirements

### Requirement: System MUST list Tencent SkillHub catalog entries
系统 MUST 支持从腾讯 SkillHub 拉取技能目录，并返回可用于 UI 展示的基础字段（至少包括 slug、name、description、latestVersion）。

#### Scenario: List catalog successfully
- **WHEN** 用户请求腾讯 SkillHub 技能列表
- **THEN** 系统 SHALL 返回技能数组及每个技能的基础元信息

### Requirement: System MUST support catalog search filtering
系统 MUST 支持按关键词查询腾讯 SkillHub 技能目录，且结果应仅包含匹配项。

#### Scenario: Search by keyword
- **WHEN** 用户传入搜索关键词请求腾讯 SkillHub
- **THEN** 系统 SHALL 返回匹配该关键词的技能结果集

### Requirement: System MUST expose installability status for catalog items
系统 MUST 在目录结果中返回安装状态信息（如未安装、已安装、可更新），用于前端展示“一键安装”或状态标记。

#### Scenario: Show installability in catalog result
- **WHEN** 系统返回腾讯 SkillHub 列表
- **THEN** 每条技能记录 SHALL 包含安装状态字段供 UI 决策
