# SQL 数据库脚本指南

本目录包含 ProjectFlow 系统所需的核心数据库脚本。

## 1. 🚀 核心安装脚本 (推荐)

**文件**：[`FULL_DATABASE_SETUP.sql`](./FULL_DATABASE_SETUP.sql)

**用途**：**一键全功能部署脚本 (v2.3.0)**
- **包含内容**：整合了所有表结构、最新的 RLS 安全架构、高性能复合索引以及完整的团队邀请系统逻辑。
- **优点**：彻底解决了 RLS 递归循环问题，优化了提醒引擎的查询性能。
- **执行方式**：在 Supabase SQL Editor 中直接全选并执行。

---

## 2. 🔄 数据迁移脚本

**文件**：[`LEGACY_DATA_MIGRATION.sql`](./LEGACY_DATA_MIGRATION.sql)

**用途**：**从个人日程版迁移到团队版**
- **功能**：为旧用户创建个人团队，并将 `schedules` 表中的旧记录平滑迁移到新的 `tasks` 和 `work_items` 体系中。
- **前提**：必须在执行完 `FULL_DATABASE_SETUP.sql` 之后运行。

---

## 📊 架构统计
- **核心表**：10 个 (包含 `teams`, `tasks`, `work_items`, `team_invitations` 等)
- **安全机制**：全表启用 Row Level Security (RLS)
- **性能优化**：包含 12+ 针对关键业务逻辑优化的复合索引
