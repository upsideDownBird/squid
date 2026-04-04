## 1. FileEditTool 实现

- [x] 1.1 创建 `src/tools/file-edit.ts`
- [x] 1.2 定义输入 schema（file_path, old_string, new_string, replace_all）
- [x] 1.3 实现 call 方法 - 读取文件、查找匹配、替换内容
- [x] 1.4 实现多处匹配检测逻辑
- [x] 1.5 实现 mapToolResultToToolResultBlockParam 方法
- [x] 1.6 设置 maxResultSizeChars 为 50000
- [x] 1.7 编写测试用例（单个匹配、多处匹配、replace_all、未找到）

## 2. BashTool 实现

- [x] 2.1 创建 `src/tools/bash.ts`
- [x] 2.2 定义输入 schema（command, working_directory, timeout, run_in_background）
- [x] 2.3 实现 call 方法 - 使用 child_process.spawn 执行命令
- [x] 2.4 实现超时控制逻辑
- [x] 2.5 实现后台执行逻辑（返回任务 ID）
- [x] 2.6 实现 mapToolResultToToolResultBlockParam 方法
- [x] 2.7 设置 isDestructive 为 true
- [x] 2.8 编写测试用例（成功执行、失败、超时、后台执行）

## 3. PowerShellTool 实现

- [x] 3.1 创建 `src/tools/powershell.ts`
- [x] 3.2 定义输入 schema（command, working_directory, timeout, run_in_background）
- [x] 3.3 实现平台检测（仅 Windows）
- [x] 3.4 实现 call 方法 - 使用 child_process.spawn 执行 PowerShell
- [x] 3.5 实现超时和后台执行逻辑
- [x] 3.6 实现 mapToolResultToToolResultBlockParam 方法
- [x] 3.7 设置 isDestructive 为 true
- [x] 3.8 编写测试用例（Windows 平台、非 Windows 平台）

## 4. WebSearchTool 实现

- [x] 4.1 创建 `src/tools/web-search.ts`
- [x] 4.2 定义输入 schema（query, max_results）
- [x] 4.3 实现 DuckDuckGo HTML 抓取逻辑
- [x] 4.4 实现 HTML 解析提取搜索结果（标题、链接、摘要）
- [x] 4.5 实现结果数量限制（最多 10 条）
- [x] 4.6 实现 mapToolResultToToolResultBlockParam 方法
- [x] 4.7 设置 maxResultSizeChars 为 50000
- [x] 4.8 编写测试用例（成功搜索、空查询、解析失败）

## 5. Cron 工具实现

- [x] 5.1 创建 `src/tools/cron-manager.ts` - 定时任务管理器
- [x] 5.2 实现任务存储（内存 Map）
- [x] 5.3 创建 `src/tools/cron-create.ts`
- [x] 5.4 定义 CronCreateTool 输入 schema（cron_expression, task_content）
- [x] 5.5 实现 call 方法 - 使用 node-cron 创建任务
- [x] 5.6 创建 `src/tools/cron-delete.ts`
- [x] 5.7 定义 CronDeleteTool 输入 schema（task_id）
- [x] 5.8 实现 call 方法 - 停止并删除任务
- [x] 5.9 创建 `src/tools/cron-list.ts`
- [x] 5.10 定义 CronListTool 输入 schema（无参数）
- [x] 5.11 实现 call 方法 - 返回所有任务列表
- [x] 5.12 为三个工具实现 mapToolResultToToolResultBlockParam 方法
- [x] 5.13 编写测试用例（创建、删除、列出、无效 cron 表达式）

## 6. SkillTool 实现

- [x] 6.1 创建 `src/tools/skill.ts`
- [x] 6.2 定义输入 schema（skill_name, args）
- [x] 6.3 实现 call 方法 - 通过 SkillLoader 加载并执行技能
- [x] 6.4 实现技能参数传递逻辑
- [x] 6.5 实现 mapToolResultToToolResultBlockParam 方法
- [x] 6.6 设置 maxResultSizeChars 为 100000
- [x] 6.7 编写测试用例（成功调用、技能不存在、参数错误）

## 7. BriefTool 实现

- [x] 7.1 创建 `src/tools/brief.ts`
- [x] 7.2 定义输入 schema（content, prompt, type）
- [x] 7.3 实现 call 方法 - 调用 AI 模型生成摘要
- [x] 7.4 实现不同摘要类型（brief, detailed, bullet_points）
- [x] 7.5 实现内容截断逻辑（超过模型限制）
- [x] 7.6 实现 mapToolResultToToolResultBlockParam 方法
- [x] 7.7 设置 maxResultSizeChars 为 50000
- [x] 7.8 编写测试用例（简短摘要、详细摘要、要点列表、未配置 API）

## 8. AgentTool 实现

- [x] 8.1 创建 `src/tools/agent.ts`
- [x] 8.2 定义输入 schema（instruction, timeout）
- [x] 8.3 实现 call 方法 - 创建新的 TaskExecutor 实例
- [x] 8.4 实现超时控制逻辑（默认 5 分钟）
- [x] 8.5 实现上下文隔离（独立的 context）
- [x] 8.6 实现 mapToolResultToToolResultBlockParam 方法
- [x] 8.7 设置 maxResultSizeChars 为 100000
- [x] 8.8 编写测试用例（成功执行、超时、失败）

## 9. 集成和注册

- [x] 9.1 在 `src/api/task-api.ts` 中导入所有新工具
- [x] 9.2 注册 FileEditTool
- [x] 9.3 注册 BashTool
- [x] 9.4 注册 PowerShellTool
- [x] 9.5 注册 WebSearchTool
- [x] 9.6 注册 CronCreateTool、CronDeleteTool、CronListTool
- [x] 9.7 注册 SkillTool
- [x] 9.8 注册 BriefTool
- [x] 9.9 注册 AgentTool
- [x] 9.10 验证所有工具符合 Tool 接口规范

## 10. 测试和验证

- [x] 10.1 运行所有单元测试确保通过
- [x] 10.2 集成测试 - 通过 API 调用每个工具
- [x] 10.3 验证结果持久化功能正常工作
- [ ] 10.4 验证工具在 AI 对话中可以被正确调用
- [x] 10.5 更新文档说明新工具的用法和限制
