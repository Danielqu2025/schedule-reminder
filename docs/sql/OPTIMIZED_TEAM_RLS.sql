-- ==========================================
-- 优化后的团队项目管理系统 RLS 策略
-- ==========================================
-- 
-- 修复：
-- 1. 彻底解决 RLS 无限递归问题
-- 2. 允许普通团队成员查看他们所属的团队和成员列表（之前仅限所有者）
-- 3. 统一所有表的权限逻辑，确保安全且高性能
-- 
-- 使用方法：
-- 在 Supabase SQL Editor 中执行此脚本即可应用新策略
-- ==========================================

-- ==========================================
-- 1. 创建安全辅助函数 (SECURITY DEFINER)
-- ==========================================
-- 这些函数以定义者权限运行，可以绕过 RLS 内部查询，从而打破递归

-- 检查用户是否是指定团队的成员
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id bigint)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否是指定团队的所有者
CREATE OR REPLACE FUNCTION public.is_team_owner(p_team_id bigint)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM teams
    WHERE id = p_team_id
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 检查用户是否是指定工作组的成员
CREATE OR REPLACE FUNCTION public.is_work_group_member(p_group_id bigint)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM work_group_members
    WHERE work_group_id = p_group_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. 重新配置各表的 RLS 策略
-- ==========================================

-- ------------------------------------------
-- 2.1 teams 表
-- ------------------------------------------
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view their team" ON teams;
CREATE POLICY "Team members can view their team" ON teams
  FOR SELECT USING (is_team_member(id));

DROP POLICY IF EXISTS "Users can create teams" ON teams;
CREATE POLICY "Users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Team owners and admins can update team" ON teams;
CREATE POLICY "Team owners and admins can update team" ON teams
  FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Only owner can delete team" ON teams;
CREATE POLICY "Only owner can delete team" ON teams
  FOR DELETE USING (owner_id = auth.uid());

-- ------------------------------------------
-- 2.2 team_members 表
-- ------------------------------------------
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view members" ON team_members;
CREATE POLICY "Team members can view members" ON team_members
  FOR SELECT USING (is_team_member(team_id));

DROP POLICY IF EXISTS "Owners and admins can add members" ON team_members;
CREATE POLICY "Owners and admins can add members" ON team_members
  FOR INSERT WITH CHECK (is_team_owner(team_id));

DROP POLICY IF EXISTS "Owners and admins can update members" ON team_members;
CREATE POLICY "Owners and admins can update members" ON team_members
  FOR UPDATE USING (is_team_owner(team_id));

DROP POLICY IF EXISTS "Only owners can remove members" ON team_members;
CREATE POLICY "Only owners can remove members" ON team_members
  FOR DELETE USING (is_team_owner(team_id));

-- ------------------------------------------
-- 2.3 work_groups 表
-- ------------------------------------------
ALTER TABLE work_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view work groups" ON work_groups;
CREATE POLICY "Team members can view work groups" ON work_groups
  FOR SELECT USING (is_team_member(team_id));

DROP POLICY IF EXISTS "Owners and admins can create work groups" ON work_groups;
CREATE POLICY "Owners and admins can create work groups" ON work_groups
  FOR INSERT WITH CHECK (is_team_owner(team_id));

DROP POLICY IF EXISTS "Owners and admins can update work groups" ON work_groups;
CREATE POLICY "Owners and admins can update work groups" ON work_groups
  FOR UPDATE USING (is_team_owner(team_id));

DROP POLICY IF EXISTS "Owners and admins can delete work groups" ON work_groups;
CREATE POLICY "Owners and admins can delete work groups" ON work_groups
  FOR DELETE USING (is_team_owner(team_id));

-- ------------------------------------------
-- 2.4 work_group_members 表
-- ------------------------------------------
ALTER TABLE work_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Work group members can view members" ON work_group_members;
CREATE POLICY "Work group members can view members" ON work_group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM work_groups 
      WHERE id = work_group_id AND is_team_member(team_id)
    )
  );

DROP POLICY IF EXISTS "Group leaders and admins can add members" ON work_group_members;
CREATE POLICY "Group leaders and admins can add members" ON work_group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_groups 
      WHERE id = work_group_id AND is_team_owner(team_id)
    )
  );

DROP POLICY IF EXISTS "Group leaders and admins can remove members" ON work_group_members;
CREATE POLICY "Group leaders and admins can remove members" ON work_group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM work_groups 
      WHERE id = work_group_id AND is_team_owner(team_id)
    )
  );

-- ------------------------------------------
-- 2.5 tasks 表
-- ------------------------------------------
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view tasks" ON tasks;
CREATE POLICY "Team members can view tasks" ON tasks
  FOR SELECT USING (is_team_member(team_id));

DROP POLICY IF EXISTS "Team members can create tasks" ON tasks;
CREATE POLICY "Team members can create tasks" ON tasks
  FOR INSERT WITH CHECK (is_team_member(team_id) AND created_by = auth.uid());

DROP POLICY IF EXISTS "Team members can update tasks" ON tasks;
CREATE POLICY "Team members can update tasks" ON tasks
  FOR UPDATE USING (is_team_member(team_id));

DROP POLICY IF EXISTS "Task creators and admins can delete tasks" ON tasks;
CREATE POLICY "Task creators and admins can delete tasks" ON tasks
  FOR DELETE USING (is_team_owner(team_id) OR created_by = auth.uid());

-- ------------------------------------------
-- 2.6 work_items 表
-- ------------------------------------------
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view work items" ON work_items;
CREATE POLICY "Team members can view work items" ON work_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks WHERE id = task_id AND is_team_member(team_id)
    )
  );

DROP POLICY IF EXISTS "Team members can create work items" ON work_items;
CREATE POLICY "Team members can create work items" ON work_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks WHERE id = task_id AND is_team_member(team_id)
    ) AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Assignees and admins can update work items" ON work_items;
CREATE POLICY "Assignees and admins can update work items" ON work_items
  FOR UPDATE USING (
    assignee_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM tasks WHERE id = task_id AND is_team_owner(team_id)
    )
  );

DROP POLICY IF EXISTS "Creators and admins can delete work items" ON work_items;
CREATE POLICY "Creators and admins can delete work items" ON work_items
  FOR DELETE USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM tasks WHERE id = task_id AND is_team_owner(team_id)
    )
  );

-- ------------------------------------------
-- 2.7 task_comments 表
-- ------------------------------------------
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view comments" ON task_comments;
CREATE POLICY "Team members can view comments" ON task_comments
  FOR SELECT USING (
    (task_id IS NOT NULL AND EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND is_team_member(team_id))) OR
    (work_item_id IS NOT NULL AND EXISTS (SELECT 1 FROM work_items WHERE id = work_item_id AND EXISTS (SELECT 1 FROM tasks WHERE id = task_id AND is_team_member(team_id))))
  );

-- ------------------------------------------
-- 3. 性能提示
-- ------------------------------------------
-- 1. 确保所有外键都有索引
-- 2. is_team_member 函数使用了 SECURITY DEFINER，可以显著提升复杂查询的性能
-- 3. 避免在策略中使用过多的嵌套查询，改用 EXISTS 或连接查询
