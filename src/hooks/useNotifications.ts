import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Notification as DatabaseNotification } from '../types/database';

// ===== Browser Notifications (existing functionality) =====

export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    (typeof window !== 'undefined' && 'Notification' in window) ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(setPermission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied' as NotificationPermission;
  }, []);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (typeof window !== 'undefined' && 'Notification' in window && permission === 'granted') {
      new Notification(title, {
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23667eea"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
        ...options,
      });
    }
    console.log(`[Notification] ${title}: ${options?.body || ''}`);
  }, [permission]);

  return { permission, requestPermission, showNotification };
}

// ===== Database Notifications (new functionality) =====

export interface UseNotificationsResult {
  notifications: DatabaseNotification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
}

export function useNotifications(userId?: string): UseNotificationsResult {
  const [notifications, setNotifications] = useState<DatabaseNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      // 获取所有通知
      const { data: notifs, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (notifError) throw notifError;
      setNotifications(notifs || []);

      // 获取未读数量
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .is('deleted_at', null);

      if (countError) throw countError;
      setUnreadCount(count || 0);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      // 更新本地状态
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      throw err;
    }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false)
        .is('deleted_at', null);

      if (error) throw error;

      // 更新本地状态
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      throw err;
    }
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      // 更新本地状态
      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      throw err;
    }
  }, [userId, notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

// ===== Notification Creation Helper Functions =====

export async function createTaskAssignedNotification(
  recipientId: string,
  taskId: string,
  taskTitle: string,
  assignerName: string
): Promise<DatabaseNotification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${assignerName} assigned you to task: "${taskTitle}"`,
        data: { task_id: taskId, task_title: taskTitle, assigner_name: assignerName },
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to create task assigned notification:', err);
    return null;
  }
}

export async function createTaskCompletedNotification(
  recipientId: string,
  taskId: string,
  taskTitle: string,
  completerName: string
): Promise<DatabaseNotification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'task_completed',
        title: 'Task Completed',
        message: `${completerName} completed task: "${taskTitle}"`,
        data: { task_id: taskId, task_title: taskTitle, completer_name: completerName },
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to create task completed notification:', err);
    return null;
  }
}

export async function createTaskUpdatedNotification(
  recipientId: string,
  taskId: string,
  taskTitle: string,
  updaterName: string,
  updateFields: string[]
): Promise<DatabaseNotification | null> {
  try {
    const fieldsText = updateFields.join(', ');
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'task_updated',
        title: 'Task Updated',
        message: `${updaterName} updated task "${taskTitle}": ${fieldsText}`,
        data: { task_id: taskId, task_title: taskTitle, updater_name: updaterName, fields: updateFields },
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to create task updated notification:', err);
    return null;
  }
}

export async function createTaskCancelledNotification(
  recipientId: string,
  taskId: string,
  taskTitle: string,
  cancelerName: string,
  reason?: string
): Promise<DatabaseNotification | null> {
  try {
    const message = reason
      ? `${cancelerName} cancelled task "${taskTitle}". Reason: ${reason}`
      : `${cancelerName} cancelled task "${taskTitle}"`;

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'task_cancelled',
        title: 'Task Cancelled',
        message,
        data: { task_id: taskId, task_title: taskTitle, canceler_name: cancelerName, reason },
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to create task cancelled notification:', err);
    return null;
  }
}

export async function createTaskOverdueNotification(
  recipientId: string,
  taskId: string,
  taskTitle: string
): Promise<DatabaseNotification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'task_overdue',
        title: 'Task Overdue',
        message: `Task "${taskTitle}" is overdue`,
        data: { task_id: taskId, task_title: taskTitle },
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to create task overdue notification:', err);
    return null;
  }
}

export async function createScheduleReminderNotification(
  recipientId: string,
  scheduleId: string,
  scheduleTitle: string,
  reminderTime: string
): Promise<DatabaseNotification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'schedule_reminder',
        title: 'Schedule Reminder',
        message: `Reminder: "${scheduleTitle}" at ${new Date(reminderTime).toLocaleString()}`,
        data: { schedule_id: scheduleId, schedule_title: scheduleTitle, reminder_time: reminderTime },
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to create schedule reminder notification:', err);
    return null;
  }
}

export async function createTeamInvitationNotification(
  recipientId: string,
  teamId: string,
  teamName: string,
  inviterName: string
): Promise<DatabaseNotification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'team_invitation',
        title: 'Team Invitation',
        message: `${inviterName} invited you to join team: "${teamName}"`,
        data: { team_id: teamId, team_name: teamName, inviter_name: inviterName },
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to create team invitation notification:', err);
    return null;
  }
}

export async function createCommentMentionNotification(
  recipientId: string,
  taskId: string,
  taskTitle: string,
  commenterName: string,
  commentSnippet: string
): Promise<DatabaseNotification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientId,
        type: 'comment_mention',
        title: 'New Comment',
        message: `${commenterName} mentioned you in a comment on "${taskTitle}": "${commentSnippet}"`,
        data: { task_id: taskId, task_title: taskTitle, commenter_name: commenterName, comment: commentSnippet },
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Failed to create comment mention notification:', err);
    return null;
  }
}

// ===== Batch Notification Creation =====

export async function createBulkNotifications(
  notifications: Array<{
    user_id: string;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown>;
  }>
): Promise<{ success: DatabaseNotification[]; failed: string[] }> {
  const success: DatabaseNotification[] = [];
  const failed: string[] = [];

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications.map(n => ({ ...n, is_read: false })))
      .select();

    if (error) throw error;

    if (data) {
      success.push(...data);
    }
  } catch (err) {
    console.error('Failed to create bulk notifications:', err);
    failed.push(...notifications.map(n => n.user_id));
  }

  return { success, failed };
}

// ===== Auto-Cleanup of Expired Notifications =====

export function useNotificationAutoCleanup(userId?: string, cleanupIntervalMs: number = 5 * 60 * 1000) {
  const cleanupExpiredNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      // 删除 30 天前的已读通知
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('notifications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', true)
        .lt('created_at', thirtyDaysAgo.toISOString())
        .is('deleted_at', null);

      if (error) throw error;
      console.log('[NotificationAutoCleanup] Cleaned up expired notifications');
    } catch (err) {
      console.error('Failed to cleanup expired notifications:', err);
    }
  }, [userId]);

  useEffect(() => {
    // 立即执行一次
    cleanupExpiredNotifications();

    // 设置定时清理
    const interval = setInterval(cleanupExpiredNotifications, cleanupIntervalMs);

    return () => clearInterval(interval);
  }, [cleanupExpiredNotifications, cleanupIntervalMs]);
}

// ===== Export both hooks =====

// Both useBrowserNotifications and useNotifications are exported above
