## ADDED Requirements

### Requirement: System MUST install Tencent SkillHub skills with one action
系统 MUST 支持用户通过一次安装请求完成腾讯 SkillHub 技能安装，安装目标为本地技能目录。

#### Scenario: Install skill successfully
- **WHEN** 用户对某个腾讯 SkillHub 技能发起一键安装
- **THEN** 系统 SHALL 下载并安装该技能到本地目录并返回成功结果

### Requirement: System MUST validate package structure before install
系统 MUST 在安装前校验下载内容是否为合法技能包（至少包含技能入口文件），校验失败时 MUST 中止安装并返回错误。

#### Scenario: Reject invalid package
- **WHEN** 下载到的技能包缺少必要文件（如 `SKILL.md`）
- **THEN** 系统 SHALL 终止安装并返回“包结构无效”错误

### Requirement: System MUST persist installation origin metadata
系统 MUST 为已安装腾讯 SkillHub 技能记录来源信息和已安装版本，以支持后续状态判断与升级能力。

#### Scenario: Persist origin and version
- **WHEN** 某技能安装成功
- **THEN** 系统 SHALL 写入该技能的来源与版本元数据记录

### Requirement: System MUST return structured install result
系统 MUST 返回结构化安装结果，至少包含 success、slug、version、targetDir 或 error 字段。

#### Scenario: Return failure details
- **WHEN** 安装流程任一步骤失败
- **THEN** 系统 SHALL 返回结构化失败响应并附带可读错误原因
