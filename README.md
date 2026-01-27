# ProjectFlow - 智能团队项目管理系统

> 🎯 **基于 React + TypeScript + Supabase 构建的现代化项目管理平台**

[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.39-green)](https://supabase.com/)
[![Version](https://img.shields.io/badge/Version-2.2.0-orange)](https://github.com/)

---

## 📋 目录

- [项目概述](#项目概述)
- [核心功能](#核心功能)
- [最新更新 (v2.2.0)](#最新更新-v220)
- [快速开始](#快速开始)
- [数据库配置指南](#数据库配置指南)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [常见问题](#常见问题)
- [文档导航](#文档导航)

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

## ✨ 最新更新 (v2.2.0)

- 🚀 **RLS 架构重构**：引入 `SECURITY DEFINER` 安全辅助函数，彻底解决无限递归问题，并恢复了普通成员查看所属团队的权限。
- ⚡ **查询性能优化**：针对提醒引擎和任务筛选增加了 6 个核心数据库索引。
- 🏗️ **代码重构**：将团队邀请逻辑提取为独立的 `TeamInvitationManager` 组件，提升了代码的可维护性。
- 🔔 **提醒逻辑改进**：优化了 `useReminderEngine` 的查询效率，减少了客户端与数据库的无效数据交换。

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

# 4. 启动开发服务器
npm run dev
```

---

## 🏢 数据库配置指南

为确保应用正常运行，请直接在 Supabase SQL Editor 中执行以下“一键式”完整脚本：

### 🚀 终极一键配置 (推荐) ⭐⭐⭐⭐⭐
执行 [`docs/sql/PROJECT_FLOW_COMPLETE_V2.sql`](./docs/sql/PROJECT_FLOW_COMPLETE_V2.sql)。
此脚本包含：
- **完整架构**：所有表、外键、约束、触发器。
- **安全重构**：彻底解决 RLS 递归问题，并恢复成员访问权限。
- **性能增强**：针对提醒引擎和高频查询的高级索引。
- **功能补完**：完善的团队邀请系统。

---

## 📂 项目结构

```
schedule-reminder/
├── 📄 package.json                 # 项目配置 (v2.2.0)
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 Layout/              # 布局组件
│   │   ├── 📁 Toast/               # 通知系统
│   │   └── 📄 TeamInvitationManager.tsx # (New) 邀请管理组件
│   ├── 📁 pages/                   # 核心业务页面 (Team, Task, WorkItem 等)
│   ├── 📁 hooks/                   # useReminderEngine, useToast 等
│   ├── 📁 utils/                   # validation.ts 验证工具
│   └── 📄 App.tsx                  # 路由与全局状态
├── 📁 docs/
│   ├── 📁 sql/                     # 所有数据库脚本 (见 SQL_FILES_SUMMARY)
│   ├── 📄 OPTIMIZATION_SUMMARY.md  # 详细优化记录
│   └── 📄 VERIFY_DATABASE_SETUP.md # 数据库验证指南
└── 📄 vite.config.ts               # 构建配置
```

---

## 🛠️ 开发指南

### 开发命令

```bash
npm run dev     # 启动开发服务器
npm run build   # 生产环境构建
npm run lint    # 代码风格检查
```

### 代码规范
- **类型安全**：禁止使用 `any`。
- **组件化**：超过 300 行的页面组件应考虑拆分子组件。
- **状态管理**：复杂的表单交互优先考虑 `useReducer` 或逻辑解耦。

---

## ❓ 常见问题

### 1. 团队成员登录后看不到团队？
**原因**：旧版 RLS 策略存在无限递归，或权限过度限制。
**解决**：执行最新的 [`docs/sql/PROJECT_FLOW_COMPLETE_V2.sql`](./docs/sql/PROJECT_FLOW_COMPLETE_V2.sql) 脚本。它包含重构后的安全辅助函数，确保成员能正常访问其所属团队。

### 2. 邀请发送失败（报错 54001 或栈溢出）？
**原因**：数据库存储过程存在递归调用。
**解决**：执行最新的 [`docs/sql/PROJECT_FLOW_COMPLETE_V2.sql`](./docs/sql/PROJECT_FLOW_COMPLETE_V2.sql) 脚本。该脚本已将邀请逻辑优化为非递归模式。

---

## 📚 文档导航

| 文档 | 说明 |
|------|------|
| [SQL 文件摘要](./docs/SQL_FILES_SUMMARY.md) | 包含所有 SQL 脚本的用途与执行顺序 |
| [优化总结报告](./docs/OPTIMIZATION_SUMMARY.md) | 记录了 v2.2.0 版本的所有重大技术改进 |
| [验证与故障排除](./docs/VERIFY_DATABASE_SETUP.md) | 数据库设置验证与常见 RLS 报错解决 |

---

**感谢使用 ProjectFlow！** 🎉
如有问题，请查阅 [故障排除指南](./docs/TROUBLESHOOTING.md) 或提交 Issue。
