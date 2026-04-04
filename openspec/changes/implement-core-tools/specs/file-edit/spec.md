## ADDED Requirements

### Requirement: 精确字符串替换
系统 SHALL 支持在文件中精确查找并替换字符串内容。

#### Scenario: 成功替换单个匹配
- **WHEN** 用户提供文件路径、旧字符串和新字符串，且文件中只有一处匹配
- **THEN** 系统替换该匹配并保存文件

#### Scenario: 多处匹配需要明确指定
- **WHEN** 用户提供的旧字符串在文件中有多处匹配，且未设置 replace_all
- **THEN** 系统返回错误，要求提供更精确的匹配字符串

#### Scenario: 替换所有匹配
- **WHEN** 用户设置 replace_all=true
- **THEN** 系统替换文件中所有匹配的字符串

#### Scenario: 未找到匹配
- **WHEN** 用户提供的旧字符串在文件中不存在
- **THEN** 系统返回错误，说明未找到匹配

### Requirement: 文件安全性
系统 SHALL 在替换前验证文件存在且可写。

#### Scenario: 文件不存在
- **WHEN** 用户指定的文件路径不存在
- **THEN** 系统返回错误，说明文件不存在

#### Scenario: 文件只读
- **WHEN** 用户指定的文件没有写权限
- **THEN** 系统返回错误，说明文件不可写

### Requirement: 结果映射
系统 SHALL 实现 mapToolResultToToolResultBlockParam 方法，返回替换操作的摘要。

#### Scenario: 成功替换的结果
- **WHEN** 替换操作成功
- **THEN** 返回包含文件路径、替换次数的摘要信息
