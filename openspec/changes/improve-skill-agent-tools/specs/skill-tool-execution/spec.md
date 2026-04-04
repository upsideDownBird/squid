## ADDED Requirements

### Requirement: Skill tool MUST execute invocable skills
`skill` 工具在接收到有效 `skill_name` 时，系统 MUST 加载对应技能定义并执行，而不是仅返回静态技能文本。

#### Scenario: Execute an invocable skill successfully
- **WHEN** 调用 `skill` 工具且目标技能存在并标记为 `user-invocable: true`
- **THEN** 系统 SHALL 触发技能执行流程并返回结构化成功结果

### Requirement: Skill tool MUST enforce invocation constraints
`skill` 工具 MUST 在执行前校验技能调用约束，包括技能存在性、可调用性和参数基本合法性；校验失败时 MUST 返回结构化错误。

#### Scenario: Reject non-invocable skill
- **WHEN** 调用 `skill` 工具且目标技能 `user-invocable` 为 false
- **THEN** 系统 SHALL 阻止执行并返回明确错误原因

#### Scenario: Reject missing skill
- **WHEN** 调用 `skill` 工具且目标技能文件不存在
- **THEN** 系统 SHALL 返回“技能不存在”类错误并标记本次调用失败

### Requirement: Skill tool MUST normalize output mapping
`skill` 工具执行结束后 MUST 返回标准化字段（至少包含 success 与 result/error），并通过统一映射输出可被上游一致消费的结果块。

#### Scenario: Return standardized failure payload
- **WHEN** 技能执行过程中发生异常
- **THEN** 系统 SHALL 返回包含错误信息与失败状态的标准结构，并在工具结果块中标记为错误
