-- ==========================================
-- 修复 RLS 策略无限递归问题
-- ==========================================
-- 
-- 问题描述：
-- 1. teams 表的 SELECT 策略查询 team_members 表
-- 2. team_members 表的策略查询 teams 表
-- 3. 形成循环递归，导致 "infinite recursion detected" 错误
--
-- 解决方案：
-- 修改 teams 和 team_members 表的策略，避免相互查询
-- 只使用 teams.owner_id 字段进行权限检查，不查询 team_members 表
-- ==========================================

-- ==========================================
-- 步骤1：修复 teams 表的策略
-- ==========================================

-- 修复 SELECT 策略：只允许 owner 查看团队
DROP POLICY IF EXISTS "Team members can view their team" ON teams;
CREATE POLICY "Team members can view their team" ON teams
  FOR SELECT USING (
    owner_id = auth.uid()
  );

-- INSERT 策略已经是正确的，无需修改
-- CREATE POLICY "Users can create teams" ON teams
--   FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 修复 UPDATE 策略：只允许 owner 更新团队
DROP POLICY IF EXISTS "Team owners and admins can update team" ON teams;
CREATE POLICY "Team owners and admins can update team" ON teams
  FOR UPDATE USING (
    owner_id = auth.uid()
  );

-- DELETE 策略已经是正确的，无需修改
-- CREATE POLICY "Only owner can delete team" ON teams
--   FOR DELETE USING (owner_id = auth.uid());

-- ==========================================
-- 步骤2：修复 team_members 表的策略
-- ==========================================

-- 修复 SELECT 策略：只允许团队 owner 查看成员列表
DROP POLICY IF EXISTS "Team members can view members" ON team_members;
CREATE POLICY "Team members can view members" ON team_members
  FOR SELECT USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE owner_id = auth.uid()
    )
  );

-- 修复 INSERT 策略：只允许团队 owner 添加成员（包括自己）
DROP POLICY IF EXISTS "Owners and admins can add members" ON team_members;
CREATE POLICY "Owners and admins can add members" ON team_members
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT id FROM teams 
      WHERE owner_id = auth.uid()
    )
  );

-- 修复 UPDATE 策略：只允许团队 owner 更新成员
DROP POLICY IF EXISTS "Owners and admins can update members" ON team_members;
CREATE POLICY "Owners and admins can update members" ON team_members
  FOR UPDATE USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE owner_id = auth.uid()
    )
  );

-- 修复 DELETE 策略：只允许团队 owner 删除成员
DROP POLICY IF EXISTS "Only owners can remove members" ON team_members;
CREATE POLICY "Only owners can remove members" ON team_members
  FOR DELETE USING (
    team_id IN (
      SELECT id FROM teams 
      WHERE owner_id = auth.uid()
    )
  );

-- ==========================================
-- 验证
-- ==========================================
-- 执行后，应该能够：
-- 1. 成功创建团队（teams 表 INSERT）
-- 2. 成功添加自己为 owner（team_members 表 INSERT）
-- 3. 不再出现 "infinite recursion detected" 错误
-- ==========================================
