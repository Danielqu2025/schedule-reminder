# ProjectFlow - 智能团队项目管理系统

> 🎯 **基于 React + TypeScript + Supabase 构建的现代化项目管理平台**

[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39-green)](https://supabase.com/)
[![Version](https://img.shields.io/badge/Version-2.3.0-orange)](https://github.com/)

---

## 📋 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [最新更新 (v2.3.0)](#最新更新-v230)
- [快速开始](#快速开始)
- [文档与指南](#文档与指南)

---

## 🎯 项目概述

**ProjectFlow** 是一个功能完整的团队项目管理系统，支持个人日程管理和团队协作。系统采用现代化的技术栈，提供直观的用户界面、强大的权限控制和智能提醒引擎。

### 主要特性

- 🔐 **安全认证**：基于 Supabase Auth 的用户认证系统。
- 📅 **日程管理**：个人日程的创建、编辑、状态管理及自动提醒。
- 👥 **团队协作**：团队创建、成员邀请、工作组架构管理。
- 📋 **任务工作台**：任务 WBS 拆分、执行顺序配置（串行/并行）、进度跟踪。
- 📊 **智能提醒**：针对即将开始的任务和停滞不前的项目进行自动推送。
- 🛡️ **健壮安全**：基于 RLS (Row Level Security) 的严密数据隔离。

---

## ✨ 最新更新 (v2.3.0)

- 🧹 **项目结构精简**：清理了冗余的 MD 文档和历史 SQL 脚本，大幅降低维护成本。
- 📝 **文档整合**：将多个更新记录合并为 `CHANGELOG.md`，开发指南整合为 `DEVELOPMENT_GUIDE.md`。
- 🚀 **部署方案优化**：提供统一的 `FULL_DATABASE_SETUP.sql` 脚本，支持一键初始化。
- ⚡ **性能增强**：保留并优化了针对提醒引擎和工作台的核心索引。

---

## 🚀 快速开始

### 5 分钟快速启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd schedule-reminder

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入您的 Supabase URL 和 Anon Key

# 4. 初始化数据库
# 在 Supabase SQL Editor 中运行 docs/sql/FULL_DATABASE_SETUP.sql

# 5. 启动开发服务器
npm run dev
```

---

## 📚 文档与指南

| 文档 | 说明 |
|------|------|
| [📖 开发指南](./docs/DEVELOPMENT_GUIDE.md) | 环境配置、团队逻辑及权限说明 |
| [📜 更新日志](./docs/CHANGELOG.md) | 版本演进记录与重大更新说明 |
| [🗄️ 数据库脚本说明](./docs/sql/SQL_FILES_SUMMARY.md) | SQL 脚本清单与执行顺序 |
| [🧪 数据库验证](./docs/VERIFY_DATABASE_SETUP.md) | 数据库设置验证与常见问题解决 |

---

**感谢使用 ProjectFlow！** 🎉
如有问题，请查阅 [开发指南](./docs/DEVELOPMENT_GUIDE.md) 或提交 Issue。
