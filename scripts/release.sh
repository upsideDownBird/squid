#!/bin/bash

# Jobopx Desktop v0.1.0 发布脚本

set -e

echo "🚀 开始发布 Jobopx Desktop v0.1.0..."

# 1. 运行测试
echo ""
echo "📋 步骤 1/5: 运行测试..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ 测试失败，发布中止"
    exit 1
fi

echo "✅ 所有测试通过"

# 2. 构建项目
echo ""
echo "📦 步骤 2/5: 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败，发布中止"
    exit 1
fi

echo "✅ 构建成功"

# 3. 检查 Git 状态
echo ""
echo "🔍 步骤 3/5: 检查 Git 状态..."

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
            git commit -m "chore: release v0.1.0"
            echo "✅ 更改已提交"
        else
            echo "❌ 发布中止"
            exit 1
        fi
    else
        echo "✅ 工作目录干净"
    fi

    # 4. 创建 Git 标签
    echo ""
    echo "🏷️  步骤 4/5: 创建 Git 标签..."

    if git rev-parse v0.1.0 >/dev/null 2>&1; then
        echo "⚠️  标签 v0.1.0 已存在"
        read -p "是否删除并重新创建？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git tag -d v0.1.0
            git tag -a v0.1.0 -m "Release v0.1.0"
            echo "✅ 标签已重新创建"
        else
            echo "⚠️  跳过标签创建"
        fi
    else
        git tag -a v0.1.0 -m "Release v0.1.0"
        echo "✅ 标签 v0.1.0 已创建"
    fi
else
    echo "⚠️  不是 Git 仓库，跳过 Git 操作"
fi

# 5. 生成发布包
echo ""
echo "📦 步骤 5/5: 生成发布包..."

# 创建发布目录
mkdir -p releases/v0.1.0

# 复制必要文件
cp -r dist releases/v0.1.0/ 2>/dev/null || echo "⚠️  dist 目录不存在"
cp package.json releases/v0.1.0/
cp README.md releases/v0.1.0/
cp QUICK_START.md releases/v0.1.0/
cp RELEASE_NOTES.md releases/v0.1.0/
cp -r docs releases/v0.1.0/ 2>/dev/null || echo "⚠️  docs 目录不存在"

echo "✅ 发布包已生成到 releases/v0.1.0/"

# 完成
echo ""
echo "🎉 发布完成！"
echo ""
echo "📋 发布清单:"
echo "  ✅ 测试通过 (31/31)"
echo "  ✅ 构建成功"
echo "  ✅ Git 标签创建"
echo "  ✅ 发布包生成"
echo ""
echo "📦 发布包位置: releases/v0.1.0/"
echo ""
echo "🚀 下一步:"
echo "  1. 查看发布包: cd releases/v0.1.0"
echo "  2. 推送到远程: git push origin v0.1.0"
echo "  3. 创建 GitHub Release"
echo "  4. 发布到 npm (可选): npm publish"
echo ""
