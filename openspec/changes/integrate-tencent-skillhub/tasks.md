## 1. SkillHub integration foundation

- [x] 1.1 在 `src/skills/` 新增腾讯 SkillHub 客户端模块（列表查询、详情读取、下载入口），并统一错误映射。
- [x] 1.2 设计并实现 SkillHub 安装元数据结构（origin/lock），支持读取与写入。
- [x] 1.3 增加安装包结构校验能力（至少校验技能入口文件存在）并抽成可复用函数。

## 2. Catalog and installation APIs

- [x] 2.1 在 `TaskAPI` 新增腾讯 SkillHub 列表查询方法，返回 UI 需要的标准字段与安装状态。
- [x] 2.2 在 `TaskAPI` 新增腾讯 SkillHub 一键安装方法（slug + version 可选 + force 可选）。
- [x] 2.3 在后端 HTTP 路由中新增 SkillHub 列表/安装接口，并统一成功失败响应格式。

## 3. UI integration

- [x] 3.1 在技能管理界面新增“腾讯 SkillHub”列表展示区域，支持关键词搜索。
- [x] 3.2 为每个可安装技能提供“一键安装”操作，并显示安装中/成功/失败状态。
- [x] 3.3 在列表项中展示安装状态（未安装、已安装、可更新）与版本信息。

## 4. Verification and documentation

- [x] 4.1 补充测试：SkillHub 客户端、安装流程、元数据读写、TaskAPI 新增接口。
- [x] 4.2 增加集成验证：完成一次“列表查询 -> 一键安装 -> 本地可见技能”的端到端验证。
- [x] 4.3 更新文档，说明腾讯 SkillHub 配置方式、接口说明和安装故障排查。
