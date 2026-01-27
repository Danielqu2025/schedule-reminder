# 数据库设置验证指南 (v2.2.0)

本文档提供 ProjectFlow v2.2.0 版本的数据库配置验证步骤，确保所有表、索引、安全策略和辅助函数都已正确部署。

---

## ✅ 核心表结构验证

### 步骤 1：确认 9 个核心业务表已创建

在 Supabase **Table Editor** 中，您应该能看到以下表：

- ✅ `teams` - 团队基础信息
- ✅ `team_members` - 团队成员与角色映射
- ✅ `work_groups` - 团队内部工作组
- ✅ `work_group_members` - 工作组成员映射
- ✅ `tasks` - 核心任务面板
- ✅ `work_items` - 任务拆分后的工作子项
- ✅ `work_item_status_history` - 状态流转追踪表
- ✅ `task_comments` - 任务/子项评论系统
- ✅ `team_invitations` - 邮箱邀请管理表

**验证标准**：
1. 所有表都必须显示地球图标（🌐），表示 **RLS 已启用**。
2. 严禁出现 "UNRESTRICTED" 标签（橙色/红色提示）。

---

## 🛡️ 安全架构验证 (RLS)

### 重要：针对 v2.2.0 之前的版本升级

如果您从旧版本升级，或者遇到 "Infinite recursion detected" 错误：
- ✅ **唯一方案**：执行 [`docs/sql/PROJECT_FLOW_COMPLETE_V2.sql`](../docs/sql/PROJECT_FLOW_COMPLETE_V2.sql)。
- **改进点**：新架构不再依赖 RLS 内部的子查询（导致递归的主因），而是使用 `SECURITY DEFINER` 安全函数（如 `is_team_member`）进行跨表身份校验。

### 步骤 2：检查 RLS 策略数量

在 **SQL Editor** 中执行以下查询，确认策略配置是否完整：

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**预期结果参考**：
- `teams`: 4 个策略
- `team_members`: 4 个策略
- `tasks`: 3 个策略 (v2.2.0 优化版)
- 其他表通常为 2-4 个。

---

## ⚡ 性能索引验证

### 步骤 3：确认核心索引已生效

执行以下查询确认索引是否存在：

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename;
```

**关键索引名单**：
- `idx_work_items_assignee_status` (优化提醒引擎)
- `idx_tasks_group_status` (优化看板加载)
- `idx_work_group_members_user` (优化权限检查)

---

## 🧪 自动化功能测试

完成配置后，请在应用前端执行以下“冒烟测试”：

1. **创建测试**：成功创建并命名一个新团队。
2. **邀请测试**：向一个邮箱发送邀请，确认 `team_invitations` 表中生成了记录且没有报错。
3. **成员权限测试**：确认新加入的成员登录后，能在“团队”页面看到该团队（而不是空白）。
4. **提醒引擎测试**：设置一个即将到期的子项，确认每分钟的轮询没有导致数据库 CPU 飙升。

---

## 🔍 故障排除 (FAQ)

### Q: 看到 "UNRESTRICTED" 标签怎么办？
**答**：这表示该表处于“裸奔”状态。请立即执行 `PROJECT_FLOW_COMPLETE_V2.sql` 以应用最新的 RLS 策略。

### Q: 仍然报错 "stack depth limit exceeded"？
**答**：确认您是否运行了旧版的 `create_team_invitation` 函数。请重新执行 V2.2.0 脚本以覆盖旧函数。

### Q: 如何彻底重置数据库？
**警告**：这会删除所有数据。
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- 然后重新执行 PROJECT_FLOW_COMPLETE_V2.sql
```

---
**文档状态**：✅ 已同步至 v2.2.0 版本
