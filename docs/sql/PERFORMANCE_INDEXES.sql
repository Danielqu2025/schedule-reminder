-- ==========================================
-- 性能优化：数据库索引增强脚本
-- ==========================================
-- 
-- 目的：针对应用中的高频查询场景（如提醒引擎、成员筛选、工作组任务）
-- 增加缺失的索引，显著提升系统响应速度。
-- ==========================================

-- 1. 工作组成员查询优化
-- 用于：快速查找某个用户所属的所有工作组
CREATE INDEX IF NOT EXISTS idx_work_group_members_user ON work_group_members(user_id);

-- 2. 任务筛选优化
-- 用于：按工作组筛选任务，以及在看板中按状态和优先级排列
CREATE INDEX IF NOT EXISTS idx_tasks_group_status ON tasks(work_group_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- 3. 提醒引擎优化（高性能复合索引）
-- 用于：提醒引擎快速定位特定用户即将开始或停滞的工作项
CREATE INDEX IF NOT EXISTS idx_work_items_assignee_status ON work_items(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_work_items_planned_start ON work_items(planned_start_time);

-- 4. 团队邀请查询优化
-- 用于：检查邮箱是否有待处理的邀请
CREATE INDEX IF NOT EXISTS idx_team_invitations_email_status ON team_invitations(email, status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);

-- 5. 状态历史追踪优化
-- 用于：生成人员绩效报告时快速统计时间线
CREATE INDEX IF NOT EXISTS idx_work_item_history_composite ON work_item_status_history(work_item_id, changed_at);

-- ==========================================
-- 执行说明：
-- 建议在业务负载较低时于 Supabase SQL Editor 中执行。
-- ==========================================
