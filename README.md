# Jobopx Desktop

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Tests](https://img.shields.io/badge/tests-31%20passed-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**AI 驱动的桌面工作台**

一个功能完整的 AI 助手桌面应用，支持多模型、技能系统、专家角色、远程控制和自动化调度

[快速开始](#快速开始) • [功能特性](#功能特性) • [使用指南](QUICK_START.md) • [文档](#文档)

</div>

---

## 🎯 这是什么？

Jobopx Desktop 让你可以：
- 📝 自动生成文档、代码、报告
- 🔍 分析数据、审查代码  
- 📁 整理文件、生成测试
- ⏰ 定时执行任务（每天自动生成 AI 新闻摘要）
- 🌐 远程控制（通过 API 调用）

## ✨ 核心特性

- 🤖 **多模型支持** - Anthropic Claude、OpenAI GPT、DeepSeek
- 🎭 **三种任务模式** - Ask（只读）、Craft（自动）、Plan（预览）
- 🛠️ **10+ 技能模板** - 数据分析、文档生成、代码审查等
- 👥 **8 个专家角色** - 工程师、分析师、设计师、产品经理等
- 🔌 **MCP 集成** - GitHub、Slack、Notion、Jira 连接器
- 🌐 **远程控制** - HTTP API，支持远程任务执行
- ⏰ **自动化调度** - Cron 定时任务，邮件通知

## 🚀 快速开始

### 1. 安装依赖

```bash
cd jobopx-desktop
npm install
```

### 2. 配置 API 密钥

获取至少一个 AI 模型的 API 密钥：
- [Anthropic Claude](https://console.anthropic.com/)（推荐）
- [OpenAI GPT](https://platform.openai.com/)
- [DeepSeek](https://platform.deepseek.com/)

### 3. 启动应用

```bash
# 开发模式
npm run dev

# 运行测试
npm test
```

### 4. 创建第一个任务

1. 打开应用，进入设置页面
2. 输入 API 密钥并保存
3. 点击"新建任务"
4. 选择模式、模型、工作目录
5. 输入任务指令，开始执行！

**详细使用教程**: 查看 [快速使用指南](QUICK_START.md)

## 💡 使用示例

### 代码审查
```
模式：Ask
指令：审查 src/ 目录下的代码，找出潜在的 bug
```

### 自动生成文档
```
模式：Craft
技能：文档生成
指令：为 src/api/ 目录下的所有函数生成 API 文档
```

### 定时任务
```
每天早上 9 点自动生成 AI 新闻摘要
```

## 📚 文档

- 📖 [快速使用指南](QUICK_START.md) - 5 分钟上手
- 📘 [用户文档](docs/user-guide.md) - 完整功能说明
- 📙 [开发者文档](docs/developer-guide.md) - 架构设计、扩展指南
- 📊 [测试报告](TEST_REPORT.md) - 测试覆盖、性能指标
- 📝 [发布说明](RELEASE_NOTES.md) - 版本更新日志

## 🧪 测试

```bash
npm test
```

**测试结果**: ✅ 31/31 通过 (100%)

## 🏗️ 技术栈

- **框架**: Electrobun, React, TypeScript
- **AI SDK**: Anthropic, OpenAI, DeepSeek
- **后端**: Fastify, node-cron, nodemailer
- **工具**: Zod, glob, lru-cache
- **测试**: Vitest

## 🔒 安全特性

- ✅ 文件路径沙箱验证
- ✅ API 密钥 AES-256-GCM 加密
- ✅ Token 鉴权
- ✅ 权限规则引擎

## 🛣️ 路线图

### v0.2.0 (计划中)
- 完善 UI 组件
- 更多技能模板
- 性能优化

### v0.3.0 (计划中)
- 插件系统
- 云端同步
- 团队协作

## 🤝 贡献

欢迎贡献！查看 [开发者文档](docs/developer-guide.md) 了解如何扩展功能。

## 📄 许可证

MIT License

---

<div align="center">

**Made with ❤️ by Jobopx Team**

[⬆ 回到顶部](#jobopx-desktop)

</div>
