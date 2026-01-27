# SQL 文件说明

## 文件结构

### 核心数据库设置文件

1. **`TEAM_DATABASE_COMPLETE.sql`** - 完整数据库设置脚本（推荐用于全新安装）
   - 包含所有表结构、索引、约束、触发器和 RLS 策略
   - 已修复所有递归问题
   - 用途：一次性创建完整的数据库结构

2. **`TEAM_INVITATIONS_SETUP.sql`** - 团队邀请功能设置脚本
   - 创建 `team_invitations` 表
   - 创建邀请相关的数据库函数
   - 已修复栈溢出和列名歧义问题
   - 用途：添加邮箱邀请功能

### 修复文件

3. **`FIX_RLS_RECURSION.sql`** - 修复 RLS 递归问题
   - 修复 `teams` 和 `team_members` 表的 RLS 策略
   - 解决 "infinite recursion detected" 错误
   - 用途：如果遇到 RLS 递归错误，执行此脚本

4. **`FIX_TEAM_INVITATION_FUNCTION_SIMPLE.sql`** - 修复邀请函数栈溢出问题
   - 修复 `create_team_invitation` 函数的栈溢出问题
   - 简化函数逻辑，移除可能导致递归的查询
   - 用途：如果遇到 "stack depth limit exceeded" 错误，执行此脚本

### 数据迁移文件

5. **`MIGRATION_EXECUTE.sql`** - 数据迁移脚本
   - 从个人版迁移到团队版
   - 创建默认团队和工作组
   - 迁移 schedules 到 tasks
   - 用途：将现有个人日程数据迁移到团队版本

## 使用指南

### 全新安装

1. **执行完整数据库设置**：
   ```sql
   -- 在 Supabase SQL Editor 中执行
   -- docs/sql/TEAM_DATABASE_COMPLETE.sql
   ```

2. **添加邀请功能**：
   ```sql
   -- 在 Supabase SQL Editor 中执行
   -- docs/sql/TEAM_INVITATIONS_SETUP.sql
   ```

### 修复问题

#### 如果遇到 RLS 递归错误

```sql
-- 执行修复脚本
-- docs/sql/FIX_RLS_RECURSION.sql
```

#### 如果遇到邀请函数栈溢出错误

```sql
-- 执行修复脚本
-- docs/sql/FIX_TEAM_INVITATION_FUNCTION_SIMPLE.sql
```

### 数据迁移

如果已有个人日程数据，需要迁移到团队版本：

```sql
-- 执行迁移脚本
-- docs/sql/MIGRATION_EXECUTE.sql
```

## 注意事项

1. **执行顺序**：
   - 先执行 `TEAM_DATABASE_COMPLETE.sql`
   - 再执行 `TEAM_INVITATIONS_SETUP.sql`
   - 修复文件可以在任何时候执行

2. **备份数据**：
   - 执行任何 SQL 脚本前，建议先备份数据库
   - 特别是在生产环境中

3. **RLS 策略**：
   - 所有表都已启用 RLS
   - 策略已优化，避免递归问题
   - 如果遇到权限问题，检查 RLS 策略是否正确配置

4. **函数权限**：
   - `create_team_invitation` 和 `accept_team_invitation` 使用 `SECURITY DEFINER`
   - 这些函数需要足够的权限才能执行
   - 确保函数所有者有正确的权限

## 文件更新历史

- **2025-01-27**: 
  - 创建 `FIX_TEAM_INVITATION_FUNCTION_SIMPLE.sql` 修复栈溢出问题
  - 更新 `TEAM_INVITATIONS_SETUP.sql` 使用简化版本的函数
  - 删除重复的修复文件
