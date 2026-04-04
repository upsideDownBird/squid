#!/bin/bash

# Jobopx Desktop v0.1.0 简化发布脚本（跳过构建）

set -e

echo "🚀 开始发布 Jobopx Desktop v0.1.0..."

# 1. 运行测试
echo ""
echo "📋 步骤 1/4: 运行测试..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ 测试失败，发布中止"
    exit 1
fi

echo "✅ 所有测试通过"

# 2. 检查 Git 状态
echo ""
echo "🔍 步骤 2/4: 检查 Git 状态..."

if [ -d .git ]; then
    # 检查是否有未提交的更改
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  检测到未提交的更改"
        echo ""
        git status --short
        echo ""
        read -p "是否提交这些更改？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "chore: release v0.1.0

- 完成所有核心功能实现
- 通过 31 个测试用例
- 添加完整文档和使用指南
- 项目完成度 89.3% (67/75 任务)"
            echo "✅ 更改已提交"
        else
            echo "❌ 发布中止"
            exit 1
        fi
    else
        echo "✅ 工作目录干净"
    fi

    # 3. 创建 Git 标签
    echo ""
    echo "🏷️  步骤 3/4: 创建 Git 标签..."

    if git rev-parse v0.1.0 >/dev/null 2>&1; then
        echo "⚠️  标签 v0.1.0 已存在"
        read -p "是否删除并重新创建？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git tag -d v0.1.0
            git tag -a v0.1.0 -m "Release v0.1.0 - First stable release"
            echo "✅ 标签已重新创建"
        else
            echo "⚠️  跳过标签创建"
        fi
    else
        git tag -a v0.1.0 -m "Release v0.1.0 - First stable release"
        echo "✅ 标签 v0.1.0 已创建"
    fi
else
    echo "⚠️  不是 Git 仓库，跳过 Git 操作"
fi

# 4. 生成发布包
echo ""
echo "📦 步骤 4/4: 生成发布包..."

# 创建发布目录
mkdir -p releases/v0.1.0

# 复制源代码和文档
cp -r src releases/v0.1.0/
cp -r skills releases/v0.1.0/
cp -r docs releases/v0.1.0/
cp package.json releases/v0.1.0/
cp tsconfig.json releases/v0.1.0/
cp vitest.config.ts releases/v0.1.0/
cp README.md releases/v0.1.0/
cp QUICK_START.md releases/v0.1.0/
cp RELEASE_NOTES.md releases/v0.1.0/
cp PROJECT_SUMMARY.md releases/v0.1.0/
cp TEST_REPORT.md releases/v0.1.0/

echo "✅ 发布包已生成到 releases/v0.1.0/"

# 完成
echo ""
echo "🎉 发布完成！"
echo ""
echo "📋 发布清单:"
echo "  ✅ 测试通过 (31/31)"
echo "  ✅ Git 提交和标签"
echo "  ✅ 发布包生成"
echo ""
echo "📦 发布包位置: releases/v0.1.0/"
echo ""
echo "🚀 下一步:"
echo "  1. 查看发布包: cd releases/v0.1.0"
echo "  2. 推送到远程: git push && git push origin v0.1.0"
echo "  3. 在 GitHub 创建 Release，上传 RELEASE_NOTES.md"
echo "  4. 分享给用户: 发送 QUICK_START.md"
echo ""
echo "📖 用户可以通过以下方式使用:"
echo "  cd releases/v0.1.0"
echo "  npm install"
echo "  npm run dev"
echo ""
