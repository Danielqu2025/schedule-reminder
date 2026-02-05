/**
 * Supabase API 层 - 统一的数据访问接口
 */

import { supabase } from '../lib/supabaseClient';
import { Schedule, Task, Team, TeamMember, WorkGroup, WorkItem, TeamInvitation, ScheduleUpdate, ScheduleAttachment } from '../types/database';

// ========== 日程管理 ==========

export const scheduleAPI = {
  /**
   * 获取用户的日程列表
   */
  async getSchedules(userId: string, options?: { status?: string }): Promise<Schedule[]> {
    const query = supabase
      .from('schedules')
      .select('*')
      .eq('user_id', userId);

    if (options?.status) {
      query.eq('status', options.status);
    }

    query.order('start_date', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * 获取单个日程
   */
  async getScheduleById(id: number): Promise<Schedule | null> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data || null;
  },

  /**
   * 创建新日程
   */
  async createSchedule(schedule: Omit<Schedule, 'id' | 'created_at'>): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert(schedule)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 更新日程状态
   */
  async updateScheduleStatus(id: number, status: Schedule['status']): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * 删除日程
   */
  async deleteSchedule(id: number): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ========== 日程更新管理 ==========

export const scheduleUpdateAPI = {
  /**
   * 获取日程的更新记录
   */
  async getUpdates(scheduleId: number): Promise<(ScheduleUpdate & { schedule_attachments?: ScheduleAttachment[] })[]> {
    const { data, error } = await supabase
      .from('schedule_updates')
      .select(`
        *,
        schedule_attachments (*)
      `)
      .eq('schedule_id', scheduleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * 创建更新记录
   */
  async createUpdate(update: Omit<ScheduleUpdate, 'id' | 'created_at'>): Promise<ScheduleUpdate> {
    const { data, error } = await supabase
      .from('schedule_updates')
      .insert(update)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 更新更新记录状态
   */
  async updateUpdateStatus(id: number, status: ScheduleUpdate['status']): Promise<void> {
    const { error } = await supabase
      .from('schedule_updates')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * 获取更新记录
   */
  async getScheduleUpdates(scheduleId: number): Promise<ScheduleUpdate[]> {
    const { data, error } = await supabase
      .from('schedule_updates')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// ========== 任务管理 ==========

export const taskAPI = {
  /**
   * 获取用户的任务列表
   */
  async getTasks(userId: string, options?: { teamId?: string; status?: string }): Promise<Task[]> {
    const { data: memberData } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId);

    if (!memberData || memberData.length === 0) {
      return [];
    }

    const userTeamIds = memberData.map((m) => m.team_id);

    let query = supabase
      .from('tasks')
      .select('*')
      .in('team_id', userTeamIds);

    if (options?.teamId) {
      query = query.eq('team_id', options.teamId);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * 创建任务
   */
  async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 更新任务状态
   */
  async updateTaskStatus(id: number, status: Task['status']): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * 删除任务
   */
  async deleteTask(id: number): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ========== 团队管理 ==========

export const teamAPI = {
  /**
   * 获取团队列表
   */
  async getTeams(userId: string): Promise<Team[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        team_id,
        teams (*)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const teamsData = (data || [])
      .map((item: { team_id: number; teams: Team[] }) => item.teams)
      .flat()
      .filter((team: Team): team is Team => team !== undefined);
    return teamsData || [];
  },

  /**
   * 获取团队详情
   */
  async getTeamById(id: number): Promise<Team | null> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data || null;
  },

  /**
   * 创建团队
   */
  async createTeam(team: Omit<Team, 'id' | 'created_at'>): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .insert(team)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 更新团队信息
   */
  async updateTeam(id: number, updates: Partial<Team>): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * 删除团队
   */
  async deleteTeam(id: number): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ========== 团队成员管理 ==========

export const teamMemberAPI = {
  /**
   * 获取团队的所有成员
   */
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);

    if (error) throw error;
    return data || [];
  },

  /**
   * 邀请成员
   */
  async inviteMember(invitation: Omit<TeamInvitation, 'id' | 'token' | 'status' | 'created_at'>): Promise<TeamInvitation> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        ...invitation,
        token,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 移除成员
   */
  async removeMember(memberId: number): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
  },
};

// ========== 工作组管理 ==========

export const workGroupAPI = {
  /**
   * 获取团队的工组列表
   */
  async getWorkGroups(teamId: number): Promise<WorkGroup[]> {
    const { data, error } = await supabase
      .from('work_groups')
      .select('*')
      .eq('team_id', teamId);

    if (error) throw error;
    return data || [];
  },

  /**
   * 创建工作组
   */
  async createWorkGroup(group: Omit<WorkGroup, 'id' | 'created_at'>): Promise<WorkGroup> {
    const { data, error } = await supabase
      .from('work_groups')
      .insert(group)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 更新工作组
   */
  async updateWorkGroup(id: number, updates: Partial<WorkGroup>): Promise<void> {
    const { error } = await supabase
      .from('work_groups')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },
};

// ========== 工作子项管理 ==========

export const workItemAPI = {
  /**
   * 获取任务的工作子项
   */
  async getWorkItems(taskId: number): Promise<WorkItem[]> {
    const { data, error } = await supabase
      .from('work_items')
      .select('*')
      .eq('task_id', taskId)
      .order('sequence_number', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * 创建工作子项
   */
  async createWorkItem(item: Omit<WorkItem, 'id' | 'created_at' | 'updated_at'>): Promise<WorkItem> {
    const { data, error } = await supabase
      .from('work_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 更新工作子项状态
   */
  async updateWorkItemStatus(id: number, status: WorkItem['status'], progress: number): Promise<void> {
    const { error } = await supabase
      .from('work_items')
      .update({ status, progress })
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * 删除工作子项
   */
  async deleteWorkItem(id: number): Promise<void> {
    const { error } = await supabase
      .from('work_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
