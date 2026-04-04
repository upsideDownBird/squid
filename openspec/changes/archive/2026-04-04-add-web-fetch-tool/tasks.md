## 1. 安装依赖

- [x] 1.1 安装 turndown - HTML 到 Markdown 转换库
- [x] 1.2 安装 axios - HTTP 客户端
- [x] 1.3 安装 lru-cache - LRU 缓存实现

## 2. 实现工具辅助函数

- [x] 2.1 创建 `src/tools/web-fetch-utils.ts`
- [x] 2.2 实现 `fetchURL` 函数 - 使用 axios 获取网页内容
- [x] 2.3 实现 `htmlToMarkdown` 函数 - 使用 turndown 转换 HTML
- [x] 2.4 实现 URL 缓存机制 - LRUCache 配置和使用
- [x] 2.5 添加错误处理和超时控制

## 3. 实现 WebFetchTool

- [x] 3.1 创建 `src/tools/web-fetch.ts`
- [x] 3.2 定义输入 schema（url, prompt）
- [x] 3.3 实现 call 方法 - 获取和处理网页内容
- [x] 3.4 实现 mapToolResultToToolResultBlockParam 方法
- [x] 3.5 设置 maxResultSizeChars 为 100000

## 4. 集成和注册

- [x] 4.1 在 ToolRegistry 中注册 WebFetchTool
- [x] 4.2 确保工具符合 Tool 接口规范

## 5. 测试

- [x] 5.1 测试获取简单 HTML 页面
- [x] 5.2 测试 HTML 到 Markdown 转换
- [x] 5.3 测试缓存机制（重复请求相同 URL）
- [x] 5.4 测试错误处理（404、超时、无效 URL）
- [x] 5.5 测试大内容持久化（超过 100K）
