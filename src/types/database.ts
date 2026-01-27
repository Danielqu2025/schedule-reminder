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
  date: string;
  time: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
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
  created_by: string;
  created_at: string;
  updated_at: string;
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
