# 数据库设置验证指南

本文档提供完整的数据库配置验证步骤，确保所有表、索引、约束和 RLS 策略都正确配置。

---

## ✅ 表创建验证

### 步骤 1：确认所有表已创建

在 Supabase Table Editor 中，您应该能看到以下表：

#### 个人功能表
- ✅ `schedules` - 个人日程表（如果已创建个人功能）

#### 团队功能表（必须全部存在）
- ✅ `teams` - 团队表
- ✅ `team_members` - 团队成员表
- ✅ `work_groups` - 工作组表
- ✅ `work_group_members` - 工作组成员表 ⭐（重要）
- ✅ `tasks` - 任务表
- ✅ `work_items` - 工作子项表
- ✅ `work_item_status_history` - 工作子项状态历史表
- ✅ `task_comments` - 任务评论表

**验证方法**：
1. 在 Supabase Dashboard → Table Editor 中查看
2. 所有表都应该显示地球图标（🌐），表示 RLS 已启用
3. **不应该**看到任何 "UNRESTRICTED" 标签

**如果所有表都已显示且没有 "UNRESTRICTED" 标签，说明表创建成功！** ✅

---

## ⚠️ RLS 策略验证

### 重要提示：关于 "UNRESTRICTED" 标签

如果您在 Table Editor 中看到某些表显示 **"UNRESTRICTED"** 标签（橙色/红色椭圆），这表示：

- ⚠️ **RLS（行级安全）策略未正确配置**
- ⚠️ **数据可能对所有用户开放访问**（安全风险）
- ⚠️ **需要立即修复**

**常见情况**：`work_group_members` 表可能显示 "UNRESTRICTED"，这是因为之前的 SQL 脚本遗漏了该表的策略配置。

**解决方案**：执行完整的 `docs/sql/TEAM_VERSION_SETUP.sql` 脚本，它包含所有表的完整 RLS 策略。

### 步骤 2：检查 RLS 策略

#### 方法一：在 Table Editor 中检查

1. 点击任意表（如 `teams`）
2. 查看表详情页面
3. 查找 **"Policies"** 或 **"RLS"** 标签
4. 确认是否有策略存在

#### 方法二：在 SQL Editor 中检查

执行以下 SQL 查询检查 RLS 状态：

```sql
-- 检查所有表的 RLS 状态
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 检查特定表的策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 步骤 3：如果 RLS 策略缺失

如果发现某些表没有 RLS 策略或显示 "UNRESTRICTED"，需要执行完整的 RLS 配置 SQL。

**推荐方法**：执行完整的 `docs/sql/TEAM_VERSION_SETUP.sql` 脚本，它包含所有表的完整配置。

**或执行以下补充脚本**（在 SQL Editor 中）：

```sql
-- ==========================================
-- RLS 策略配置（如果缺失）
-- ==========================================

-- 确保所有表启用 RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_item_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- teams 表策略
DROP POLICY IF EXISTS "Team members can view their team" ON teams;
CREATE POLICY "Team members can view their team" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can create teams" ON teams;
CREATE POLICY "Users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Team owners and admins can update team" ON teams;
CREATE POLICY "Team owners and admins can update team" ON teams
  FOR UPDATE USING (
    id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR owner_id = auth.uid()
  );

DROP POLICY IF EXISTS "Only owner can delete team" ON teams;
CREATE POLICY "Only owner can delete team" ON teams
  FOR DELETE USING (owner_id = auth.uid());

-- team_members 表策略
DROP POLICY IF EXISTS "Team members can view members" ON team_members;
CREATE POLICY "Team members can view members" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners and admins can add members" ON team_members;
CREATE POLICY "Owners and admins can add members" ON team_members
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Only owners can remove members" ON team_members;
CREATE POLICY "Only owners can remove members" ON team_members
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- work_groups 表策略
DROP POLICY IF EXISTS "Team members can view work groups" ON work_groups;
CREATE POLICY "Team members can view work groups" ON work_groups
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners and admins can create work groups" ON work_groups;
CREATE POLICY "Owners and admins can create work groups" ON work_groups
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Owners and admins can update work groups" ON work_groups;
CREATE POLICY "Owners and admins can update work groups" ON work_groups
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- tasks 表策略
DROP POLICY IF EXISTS "Team members can view tasks" ON tasks;
CREATE POLICY "Team members can view tasks" ON tasks
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team members can create tasks" ON tasks;
CREATE POLICY "Team members can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Team members can update tasks" ON tasks;
CREATE POLICY "Team members can update tasks" ON tasks
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Task creators and admins can delete tasks" ON tasks;
CREATE POLICY "Task creators and admins can delete tasks" ON tasks
  FOR DELETE USING (
    created_by = auth.uid()
    OR team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- work_items 表策略
DROP POLICY IF EXISTS "Team members can view work items" ON work_items;
CREATE POLICY "Team members can view work items" ON work_items
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks 
      WHERE team_id IN (
        SELECT team_id FROM team_members 
        WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Team members can create work items" ON work_items;
CREATE POLICY "Team members can create work items" ON work_items
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks 
      WHERE team_id IN (
        SELECT team_id FROM team_members 
        WHERE user_id = auth.uid()
      )
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Assignees and admins can update work items" ON work_items;
CREATE POLICY "Assignees and admins can update work items" ON work_items
  FOR UPDATE USING (
    assignee_id = auth.uid()
    OR task_id IN (
      SELECT id FROM tasks 
      WHERE team_id IN (
        SELECT team_id FROM team_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );
```

---

## 🧪 功能测试

### 步骤 4：测试应用功能

完成 RLS 配置后，测试以下功能：

#### 1. 创建团队
- ✅ 登录应用
- ✅ 点击 "团队" 菜单
- ✅ 点击 "创建团队"
- ✅ 填写团队信息并提交
- ✅ 确认创建成功

#### 2. 查看团队列表
- ✅ 确认创建的团队显示在列表中
- ✅ 确认可以点击进入团队详情

#### 3. 个人日程功能
- ✅ 确认个人日程功能仍然正常
- ✅ 可以添加、编辑、删除日程

---

## ✅ 完整验证清单

### 表结构验证
- [ ] 所有 9 个表都已创建（包括 schedules）
- [ ] 表结构正确（字段、类型、约束）
- [ ] 所有表都显示地球图标（🌐），没有 "UNRESTRICTED" 标签

### RLS 策略验证
- [ ] 所有团队相关表都启用了 RLS
- [ ] 每个表都有相应的 SELECT、INSERT、UPDATE、DELETE 策略
- [ ] `work_group_members` 表有 4 个策略 ⭐（重要）
- [ ] 执行策略查询 SQL 确认策略数量正确
- [ ] 没有表显示 "UNRESTRICTED" 标签

### 功能验证
- [ ] 可以成功创建团队
- [ ] 可以查看团队列表
- [ ] 个人日程功能正常
- [ ] 没有权限错误

### 安全验证
- [ ] 用户只能看到自己所属的团队
- [ ] 用户只能访问自己团队的数据
- [ ] 未登录用户无法访问数据

---

## 🔍 常见问题

### Q1: 表已创建但功能不工作？

**可能原因**：
- RLS 策略未配置
- 策略配置错误
- `work_group_members` 表策略缺失

**解决方法**：
1. 执行完整的 `docs/sql/TEAM_VERSION_SETUP.sql` 脚本
2. 执行策略查询 SQL 确认所有表都有正确的策略数量
3. 检查浏览器控制台错误
4. 确认用户已登录
5. 检查 Table Editor 中是否还有 "UNRESTRICTED" 标签

### Q2: 看到 "UNRESTRICTED" 标签怎么办？

**解决方法**：
1. 执行完整的 `docs/sql/TEAM_VERSION_SETUP.sql` 脚本（包含所有表的完整 RLS 策略）
2. 或执行 `docs/sql/COMPLETE_RLS_POLICIES.sql` 补充缺失的策略
3. 刷新 Table Editor
4. 确认 "UNRESTRICTED" 标签消失
5. 执行策略查询 SQL 验证策略数量

**常见情况**：`work_group_members` 表可能显示 "UNRESTRICTED"，执行完整脚本后即可解决。

### Q3: 创建团队时仍然报错？

**可能原因**：
- RLS 策略阻止了插入操作
- 策略配置不正确

**解决方法**：
1. 检查 `teams` 表的 INSERT 策略
2. 确认策略允许创建者插入
3. 查看浏览器控制台的详细错误

---

## 📚 相关文档

- [团队功能配置指南](./TEAM_SETUP_GUIDE.md)
- [数据库设置文档](../DATABASE_SETUP.md)
- [故障排除指南](./TROUBLESHOOTING.md)

---

## ✨ 总结

**如果所有表都已显示在 Table Editor 中，说明表创建成功！** ✅

但是，请务必：
1. ✅ 验证 RLS 策略已正确配置
2. ✅ 测试应用功能是否正常
3. ✅ 确认没有安全漏洞

完成以上步骤后，您的数据库设置就完全准备好了！🎉
