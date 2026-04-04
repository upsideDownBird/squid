# Jobopx Desktop 用户文档

## 快速开始

### 安装

```bash
npm install
npm run build
npm start
```

### 首次配置

1. 打开设置页面
2. 配置 API 密钥（Anthropic、OpenAI 或 DeepSeek）
3. 保存设置

### 创建第一个任务

1. 点击"新建任务"按钮
2. 选择任务模式：
   - **Ask 模式**：只读查询，不修改文件
   - **Craft 模式**：自动执行，直接修改文件
   - **Plan 模式**：先生成计划，确认后执行
3. 选择 AI 模型
4. 指定工作目录
5. （可选）选择技能或专家
6. 输入任务指令
7. 点击"创建"

## 功能说明

### 任务模式

- **Ask 模式**：适合代码查询、问题解答，不会修改任何文件
- **Craft 模式**：适合快速开发，AI 自动执行所有操作
- **Plan 模式**：适合复杂任务，先审查计划再执行

### 技能系统

预置 10+ 技能模板：
- 数据分析
- 文档生成
- 代码审查
- 文件整理
- API 文档生成
- 测试生成
- SQL 助手
- 正则表达式助手
- Git 提交信息生成
- Markdown 转换

### 专家系统

8 种专家角色：
- 软件工程师
- 数据科学家
- 技术写作
- 产品经理
- UI 设计师
- DevOps 工程师
- 营销专家
- 业务分析师

### MCP 连接器

支持连接外部服务：
- GitHub
- Slack
- Notion
- Jira

### Claw 远程控制

通过 HTTP API 远程控制 Jobopx：

```bash
# 创建任务
curl -X POST http://localhost:3000/task \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "分析代码质量"}'

# 查询任务状态
curl http://localhost:3000/task/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 定时任务

1. 进入"定时任务"页面
2. 点击"新建定时任务"
3. 配置任务参数和 Cron 表达式
4. 启用任务

预设模板：
- 每日 AI 新闻摘要
- 周报生成
- 代码仓库健康检查
- 每日任务提醒

## 常见问题

**Q: 如何切换 AI 模型？**  
A: 在任务创建向导的第二步选择模型，或在设置中配置默认模型。

**Q: 工作目录有什么限制？**  
A: 所有文件操作都限制在指定的工作目录内，无法访问目录外的文件。

**Q: 如何备份数据？**  
A: 所有配置和历史记录保存在 `~/.jobopx/` 目录，定期备份该目录即可。
