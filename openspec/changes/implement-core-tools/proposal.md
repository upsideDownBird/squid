## Why

当前项目只有基础的文件读写和搜索工具，缺少命令执行、文件编辑、网页搜索、定时任务等核心能力。参考 claude-code-main 的成熟实现，补齐这些基础工具可以大幅提升 AI 助手的实用性和问题解决能力。

## What Changes

- 新增 FileEditTool - 支持精确的文件内容替换（比重写整个文件更高效）
- 新增 BashTool - 执行 Bash 命令（带超时和错误处理）
- 新增 PowerShellTool - 执行 PowerShell 命令（Windows 支持）
- 新增 WebSearchTool - 网页搜索能力（补充 WebFetch）
- 新增 CronCreateTool - 创建定时任务
- 新增 CronDeleteTool - 删除定时任务
- 新增 CronListTool - 列出定时任务
- 新增 SkillTool - 调用技能系统
- 新增 BriefTool - 生成简报摘要
- 新增 AgentTool - 调用子代理

## Capabilities

### New Capabilities
- `file-edit`: 精确替换文件内容，支持字符串匹配和替换
- `bash-execution`: 执行 Bash 命令，支持超时控制和后台运行
- `powershell-execution`: 执行 PowerShell 命令（Windows 平台）
- `web-search`: 网页搜索，返回搜索结果列表
- `cron-management`: 定时任务管理（创建、删除、列出）
- `skill-invocation`: 调用已注册的技能
- `brief-generation`: 生成内容摘要和简报
- `agent-delegation`: 调用子代理处理复杂任务

### Modified Capabilities
<!-- 无现有能力需要修改 -->

## Impact

**新增文件**:
- `src/tools/file-edit.ts` - FileEditTool 实现
- `src/tools/bash.ts` - BashTool 实现
- `src/tools/powershell.ts` - PowerShellTool 实现
- `src/tools/web-search.ts` - WebSearchTool 实现
- `src/tools/cron-create.ts` - CronCreateTool 实现
- `src/tools/cron-delete.ts` - CronDeleteTool 实现
- `src/tools/cron-list.ts` - CronListTool 实现
- `src/tools/skill.ts` - SkillTool 实现
- `src/tools/brief.ts` - BriefTool 实现
- `src/tools/agent.ts` - AgentTool 实现

**修改文件**:
- `src/api/task-api.ts` - 注册所有新工具

**依赖**:
- 可能需要安装搜索 API 相关依赖（如 Google Search API 或其他搜索服务）
- 需要 node-cron 库（已安装）用于定时任务

**影响范围**:
- 工具系统：新增 10 个工具
- 不影响现有工具和功能
- BashTool 和 PowerShellTool 需要系统命令执行权限
- WebSearchTool 可能需要外部 API 密钥
