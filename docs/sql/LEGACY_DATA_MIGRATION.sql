-- ==========================================
-- 团队项目管理系统 - 数据迁移脚本 (从个人版到团队版)
-- ==========================================

-- 1. 为每个拥有日程的用户创建一个“默认个人团队”
INSERT INTO teams (name, owner_id, description)
SELECT 
  '个人团队' as name,
  user_id as owner_id,
  '从个人日程迁移的默认团队' as description
FROM schedules
GROUP BY user_id
ON CONFLICT DO NOTHING;

-- 2. 将用户设为自己团队的 Owner
INSERT INTO team_members (team_id, user_id, role)
SELECT 
  id as team_id,
  owner_id as user_id,
  'owner' as role
FROM teams
WHERE name = '个人团队'
ON CONFLICT DO NOTHING;

-- 3. 在每个团队下创建一个“默认工作组”
INSERT INTO work_groups (team_id, name, description, leader_id)
SELECT 
  id as team_id,
  '默认工作组' as name,
  '个人工作默认组' as description,
  owner_id as leader_id
FROM teams
WHERE name = '个人团队'
ON CONFLICT DO NOTHING;

-- 4. 迁移 schedules 到 tasks
INSERT INTO tasks (team_id, work_group_id, title, description, start_date, end_date, status, created_by, created_at)
SELECT 
  t.id as team_id,
  wg.id as work_group_id,
  s.title,
  s.description,
  s.date as start_date,
  s.date as end_date,
  s.status,
  s.user_id as created_by,
  s.created_at
FROM schedules s
JOIN teams t ON t.owner_id = s.user_id AND t.name = '个人团队'
JOIN work_groups wg ON wg.team_id = t.id AND wg.name = '默认工作组'
ON CONFLICT DO NOTHING;

-- 5. 为每个迁移过来的任务创建一个对应的并行工作子项 (Work Item)
INSERT INTO work_items (task_id, title, description, execution_order, planned_start_time, assignee_id, status, created_by, created_at)
SELECT 
  t.id as task_id,
  t.title as title,
  t.description as description,
  'parallel' as execution_order,
  (t.start_date || ' 09:00:00')::timestamp as planned_start_time,
  t.created_by as assignee_id,
  t.status as status,
  t.created_by as created_by,
  t.created_at as created_at
FROM tasks t
WHERE t.team_id IN (SELECT id FROM teams WHERE name = '个人团队')
ON CONFLICT DO NOTHING;

-- 注意：迁移完成后，请确保 RLS 策略已正确开启。
