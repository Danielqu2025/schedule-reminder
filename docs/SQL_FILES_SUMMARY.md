# SQL 文件整理总结

## 文件列表

### 核心数据库设置文件

1. **`TEAM_DATABASE_COMPLETE.sql`** ⭐ 推荐
   - **用途**：完整数据库设置脚本（全新安装）
   - **内容**：所有表结构、索引、约束、触发器、RLS 策略
   - **状态**：已修复所有递归问题，可直接使用
   - **执行顺序**：第一步

2. **`TEAM_INVITATIONS_SETUP.sql`** ⭐ 推荐
   - **用途**：团队邀请功能设置
   - **内容**：`team_invitations` 表、邀请相关函数、RLS 策略
   - **状态**：已修复栈溢出和列名歧义问题
   - **执行顺序**：第二步（在 TEAM_DATABASE_COMPLETE.sql 之后）

### 修复文件

3. **`FIX_RLS_RECURSION.sql`**
   - **用途**：修复 RLS 递归问题
   - **问题**：`infinite recursion detected in policy for relation "teams"` 或 `"team_members"`
   - **执行时机**：如果遇到 RLS 递归错误时执行

4. **`FIX_TEAM_INVITATION_FUNCTION_SIMPLE.sql`**
   - **用途**：修复邀请函数栈溢出问题
   - **问题**：`stack depth limit exceeded` (错误代码 54001)
   - **执行时机**：如果遇到栈溢出错误时执行

### 数据迁移文件

5. **`MIGRATION_EXECUTE.sql`**
   - **用途**：从个人版迁移到团队版
   - **内容**：创建默认团队、迁移 schedules 到 tasks
   - **执行时机**：已有个人日程数据需要迁移时

## 推荐执行顺序

### 全新安装

```sql
-- 1. 执行完整数据库设置
-- docs/sql/TEAM_DATABASE_COMPLETE.sql

-- 2. 添加邀请功能（可选）
-- docs/sql/TEAM_INVITATIONS_SETUP.sql
```

### 修复问题

```sql
-- 如果遇到 RLS 递归错误
-- docs/sql/FIX_RLS_RECURSION.sql

-- 如果遇到邀请函数栈溢出错误
-- docs/sql/FIX_TEAM_INVITATION_FUNCTION_SIMPLE.sql
```

## 已删除的文件

以下文件已被删除（功能已整合到主文件中）：
- ~~`TEAM_VERSION_SETUP.sql`~~ → 已整合到 `TEAM_DATABASE_COMPLETE.sql`
- ~~`COMPLETE_RLS_POLICIES.sql`~~ → 已整合到 `TEAM_DATABASE_COMPLETE.sql`
- ~~`FIX_ALL_TEAM_MEMBERS_RLS.sql`~~ → 已整合到 `FIX_RLS_RECURSION.sql`
- ~~`FIX_TEAM_INVITATION_FUNCTION.sql`~~ → 已整合到 `FIX_TEAM_INVITATION_FUNCTION_SIMPLE.sql`
- ~~`FIX_TEAM_INVITATION_FUNCTION_FINAL.sql`~~ → 已整合到 `FIX_TEAM_INVITATION_FUNCTION_SIMPLE.sql`

## 文件说明

详细说明请查看：`docs/sql/README.md`
