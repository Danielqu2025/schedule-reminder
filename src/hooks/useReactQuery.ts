/**
 * React Query Hooks - 数据获取和状态管理
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';

// ========== 日程管理 Hooks ==========

export function useSchedules(userId: string, options?: { enabled?: boolean; status?: string }) {
  return useQuery({
    queryKey: ['schedules', userId, options?.status],
    queryFn: () => api.scheduleAPI.getSchedules(userId, options),
    enabled: !!userId && options?.enabled !== false,
  });
}

export function useSchedule(id: number) {
  return useQuery({
    queryKey: ['schedule', id],
    queryFn: () => api.scheduleAPI.getScheduleById(id),
    enabled: !!id,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { user_id: string; title: string; start_date: string; end_date?: string; description?: string; status: 'pending' | 'in_progress' | 'completed' | 'cancelled' }) =>
      api.scheduleAPI.createSchedule(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['schedules', data.user_id] });
    },
  });
}

export function useUpdateScheduleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'pending' | 'in_progress' | 'completed' | 'cancelled' }) =>
      api.scheduleAPI.updateScheduleStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schedules', variables.id] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.scheduleAPI.deleteSchedule(id),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['schedules', userId] });
    },
  });
}

// ========== 日程更新 Hooks ==========

export function useScheduleUpdates(scheduleId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['schedule-updates', scheduleId],
    queryFn: () => api.scheduleUpdateAPI.getUpdates(scheduleId),
    enabled: !!scheduleId && options?.enabled !== false,
  });
}

export function useCreateScheduleUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { schedule_id: number; user_id: string; content: string; status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' }) =>
      api.scheduleUpdateAPI.createUpdate(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['schedule-updates', data.schedule_id] });
      queryClient.invalidateQueries({ queryKey: ['schedules', data.user_id] });
    },
  });
}

// ========== 任务管理 Hooks ==========

export function useTasks(userId: string, options?: { enabled?: boolean; teamId?: string; status?: string }) {
  return useQuery({
    queryKey: ['tasks', userId, options?.teamId, options?.status],
    queryFn: () => api.taskAPI.getTasks(userId, options),
    enabled: !!userId && options?.enabled !== false,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { user_id: string; team_id: number; title: string; description?: string; start_date?: string; end_date?: string; status: 'pending' | 'in_progress' | 'completed' | 'cancelled'; priority: 'low' | 'medium' | 'high'; created_by: string }) =>
      api.taskAPI.createTask(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.user_id] });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'pending' | 'in_progress' | 'completed' | 'cancelled' }) =>
      api.taskAPI.updateTaskStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.taskAPI.deleteTask(id),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}

// ========== 团队管理 Hooks ==========

export function useTeams(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['teams', userId],
    queryFn: () => api.teamAPI.getTeams(userId),
    enabled: !!userId && options?.enabled !== false,
  });
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: ['team', id],
    queryFn: () => api.teamAPI.getTeamById(id),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; description?: string; owner_id: string }) =>
      api.teamAPI.createTeam(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['teams', data.owner_id] });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<{ name?: string; description?: string }> }) =>
      api.teamAPI.updateTeam(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team', variables.id] });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.teamAPI.deleteTeam(id),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['teams', userId] });
    },
  });
}

// ========== 团队成员 Hooks ==========

export function useTeamMembers(teamId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => api.teamMemberAPI.getTeamMembers(teamId),
    enabled: !!teamId && options?.enabled !== false,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { team_id: number; email: string; invited_by: string; expires_at: string }) =>
      api.teamMemberAPI.inviteMember(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', data.team_id] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: number) => api.teamMemberAPI.removeMember(memberId),
    onSuccess: (_, teamId) => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
  });
}

// ========== 工作组 Hooks ==========

export function useWorkGroups(teamId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['work-groups', teamId],
    queryFn: () => api.workGroupAPI.getWorkGroups(teamId),
    enabled: !!teamId && options?.enabled !== false,
  });
}

export function useCreateWorkGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { team_id: number; name: string; description?: string; leader_id?: string }) =>
      api.workGroupAPI.createWorkGroup(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['work-groups', data.team_id] });
    },
  });
}

export function useUpdateWorkGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<{ name?: string; description?: string; leader_id?: string }> }) =>
      api.workGroupAPI.updateWorkGroup(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-groups', variables.id] });
    },
  });
}

// ========== 工作子项 Hooks ==========

export function useWorkItems(taskId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['work-items', taskId],
    queryFn: () => api.workItemAPI.getWorkItems(taskId),
    enabled: !!taskId && options?.enabled !== false,
  });
}

export function useCreateWorkItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { task_id: number; title: string; description?: string; execution_order: 'parallel' | 'sequential'; status: 'pending' | 'in_progress' | 'completed' | 'cancelled'; created_by: string; sequence_number: number; progress: number }) =>
      api.workItemAPI.createWorkItem(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['work-items', data.task_id] });
    },
  });
}

export function useUpdateWorkItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, progress }: { id: number; status: 'pending' | 'in_progress' | 'completed' | 'cancelled'; progress: number }) =>
      api.workItemAPI.updateWorkItemStatus(id, status, progress),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-items', variables.id] });
    },
  });
}

export function useDeleteWorkItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.workItemAPI.deleteWorkItem(id),
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['work-items', taskId] });
    },
  });
}
