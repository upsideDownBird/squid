## Why

当前项目缺少获取网页内容的能力。用户需要 AI 能够访问在线文档、API 文档、技术文章等网页资源来辅助开发工作。参考 claude-code-main 的实现，添加 WebFetch 工具可以让 AI 获取并分析网页内容，提升问题解决能力。

## What Changes

- 新增 WebFetchTool 工具，支持获取和处理网页内容
- 实现 HTML 到 Markdown 的转换
- 集成 AI 模型对网页内容进行摘要和提取
- 添加 URL 缓存机制（15分钟 TTL）
- 支持预批准域名列表（如官方文档站点）
- 实现结果映射方法，符合工具结果持久化规范
- 在工具注册表中注册新工具

## Capabilities

### New Capabilities
- `web-fetch`: 获取指定 URL 的网页内容，转换为 Markdown 格式，并使用 AI 模型根据用户提示处理内容

### Modified Capabilities
<!-- 无现有能力需要修改 -->

## Impact

**新增文件**:
- `src/tools/web-fetch.ts` - WebFetch 工具实现
- `src/tools/web-fetch-utils.ts` - 工具辅助函数（HTML 转换、缓存等）

**修改文件**:
- `src/tools/registry.ts` - 注册 WebFetchTool

**依赖**:
- 需要安装 `turndown` - HTML 到 Markdown 转换
- 需要安装 `axios` - HTTP 请求
- 需要安装 `lru-cache` - URL 缓存
- 需要 Anthropic API 访问权限（用于内容摘要）

**影响范围**:
- 工具系统：新增一个只读工具
- 不影响现有工具和功能
- 需要网络访问权限
