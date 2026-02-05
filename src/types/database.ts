// 数据库类型定义

export interface User {
  id: string;
  email?: string;
}

// 个人版本 - Schedule
export interface Schedule {
  id: number;
  user_id: string;
  title: string;
  start_date: string; // 计划启动日期
  end_date?: string;  // 计划完成日期（可选）
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'urgent' | 'high' | 'medium' | 'low'; // 优先级
  reminder_time?: string; // 提醒时间
  reminder_type?: 'email' | 'sms' | 'app'; // 提醒类型
  completion_notes?: string; // 完成备注
  deleted_at?: string; // 软删除时间
  created_at: string;
}

// 日程更新记录
export interface ScheduleUpdate {
  id: number;
  schedule_id: number;
  user_id: string;
  content: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  schedule_attachments?: ScheduleAttachment[];
}

// 日程附件
export interface ScheduleAttachment {
  id: number;
  update_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: string;
}

// 团队版本 - Team
export interface Team {
  id: number;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
}

// 团队成员
export interface TeamMember {
  id: number;
  team_id: number;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

// 工作组
export interface WorkGroup {
  id: number;
  team_id: number;
  name: string;
  description?: string;
  leader_id?: string;
  created_at: string;
}

// 工作组成员
export interface WorkGroupMember {
  id: number;
  work_group_id: number;
  user_id: string;
  joined_at: string;
}

// 任务
export interface Task {
  id: number;
  team_id: number;
  work_group_id?: number;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  estimated_hours?: number; // 新增：预估工时
  actual_hours?: number; // 新增：实际工时
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string; // 新增：软删除时间
}

// 工作子项
export interface WorkItem {
  id: number;
  task_id: number;
  title: string;
  description?: string;
  execution_order: 'parallel' | 'sequential';
  sequence_number: number;
  planned_start_time?: string;
  duration_hours?: number;
  planned_end_time?: string;
  assignee_id?: string;
  collaborators?: string; // JSON数组
  blocked_reason?: string; // 新增：阻塞原因
  objectives?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked';
  progress: number; // 0-100
  actual_start_time?: string;
  actual_end_time?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// 工作子项状态历史
export interface WorkItemStatusHistory {
  id: number;
  work_item_id: number;
  status: string;
  progress: number;
  changed_by: string;
  changed_at: string;
}

// 任务评论
export interface TaskComment {
  id: number;
  task_id?: number;
  work_item_id?: number;
  user_id: string;
  content: string;
  created_at: string;
}

// 团队邀请
export interface TeamInvitation {
  id: number;
  team_id: number;
  email: string;
  invited_by: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

// ========== 新增类型 ==========

// 日程标签
export interface ScheduleTag {
  id: number;
  schedule_id: number;
  tag_name: string;
  created_at: string;
}

// 任务附件
export interface TaskAttachment {
  id: number;
  task_id: number;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  uploaded_at: string;
  uploaded_by?: string;
}

// 任务依赖关系
export interface TaskDependency {
  id: number;
  task_id: number;
  depends_on_task_id: number;
  dependency_type: 'finish_to_start' | 'start_to_start';
  created_at: string;
}

// 通知
export interface Notification {
  id: number;
  user_id: string;
  type: string;
  title: string;
  content?: string;
  related_type?: string;
  related_id?: number;
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

// 审计日志
export interface AuditLog {
  id: number;
  table_name: string;
  record_id: number;
  action: string;
  changed_by: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  changed_at: string;
}
