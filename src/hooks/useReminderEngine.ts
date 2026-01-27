import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Schedule } from '../types/database';
import { useNotifications } from './useNotifications';
import { isWithinInterval, addMinutes, parse, format, differenceInDays, parseISO, isValid } from 'date-fns';

const REMINDER_CACHE_KEY = 'projectflow_reminded_ids';

/**
 * 提醒引擎钩子
 * 处理个人日程、任务停滞、团队工作项提醒
 * 注意：此提醒基于客户端时间，若跨时区使用请确保存储格式为 UTC
 */
export function useReminderEngine(userId: string | undefined) {
  const { showNotification } = useNotifications();
  
  // 初始化已提醒 ID
  const getInitialRemindedIds = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    const cached = localStorage.getItem(REMINDER_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return new Set(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('Failed to parse reminder cache', e);
      }
    }
    return new Set();
  };

  const remindedIds = useRef<Set<string>>(getInitialRemindedIds());

  // 辅助函数：持久化已提醒 ID
  const saveRemindedIds = useCallback((id: string) => {
    remindedIds.current.add(id);
    localStorage.setItem(REMINDER_CACHE_KEY, JSON.stringify(Array.from(remindedIds.current)));
  }, []);

  // 辅助函数：尝试解析多种时间格式
  const parseScheduleTime = (timeStr: string, referenceDate: Date) => {
    // 尝试 HH:mm:ss
    let parsed = parse(timeStr, 'HH:mm:ss', referenceDate);
    if (isValid(parsed)) return parsed;
    
    // 尝试 HH:mm
    parsed = parse(timeStr, 'HH:mm', referenceDate);
    return parsed;
  };

  const lastStagnantCheck = useRef<number>(0);

  // 1. 检查即将到期的日程
  const checkUpcomingSchedules = useCallback(async () => {
    if (!userId) return;

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const { data: schedules, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('date', todayStr)
        .not('status', 'in', '("completed","cancelled")');

      if (error) throw error;
      if (!schedules) return;

      const now = new Date();
      const nextInterval = addMinutes(now, 2); // 扩大窗口到2分钟，防止漏检

      schedules.forEach((schedule: Schedule) => {
        const cacheId = `schedule-${schedule.id}`;
        if (remindedIds.current.has(cacheId)) return;

        const scheduleTime = parseScheduleTime(schedule.time, now);
        if (!isValid(scheduleTime)) return;

        if (isWithinInterval(scheduleTime, { start: now, end: nextInterval })) {
          showNotification(`🔔 日程提醒: ${schedule.title}`, {
            body: `时间: ${schedule.time}${schedule.description ? `\n描述: ${schedule.description}` : ''}`,
            tag: cacheId,
          });
          saveRemindedIds(cacheId);
        }
      });
    } catch (error) {
      console.error('Check upcoming schedules failed:', error);
    }
  }, [userId, showNotification, saveRemindedIds]);

  // 2. 检查停滞的任务
  const checkStagnantTasks = useCallback(async () => {
    if (!userId) return;

    const now = Date.now();
    if (now - lastStagnantCheck.current < 3600000) return;
    lastStagnantCheck.current = now;

    try {
      const { data: schedules, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userId)
        .not('status', 'in', '("completed","cancelled")');

      if (error) throw error;
      if (!schedules) return;

      const stagnantTasks: Schedule[] = [];
      const today = new Date();

      schedules.forEach((schedule: Schedule) => {
        const createdAt = new Date(schedule.created_at);
        const daysSinceCreated = differenceInDays(today, createdAt);

        if (schedule.status === 'pending' && daysSinceCreated >= 3) {
          stagnantTasks.push(schedule);
        } else if (schedule.status === 'in_progress' && daysSinceCreated >= 7) {
          stagnantTasks.push(schedule);
        }
      });

      if (stagnantTasks.length > 0) {
        showNotification('🔄 任务状态更新提醒', {
          body: `您有 ${stagnantTasks.length} 个任务长时间未更新状态，请及时处理。`,
          tag: 'stagnant-tasks',
        });
      }
    } catch (error) {
      console.error('Check stagnant tasks failed:', error);
    }
  }, [userId, showNotification]);

  // 3. 检查即将到期的团队工作子项
  const checkUpcomingWorkItems = useCallback(async () => {
    if (!userId) return;

    try {
      const now = new Date();
      const soon = addMinutes(now, 15);

      const { data: workItems, error } = await supabase
        .from('work_items')
        .select('id, title, planned_start_time')
        .eq('assignee_id', userId)
        .not('status', 'in', '("completed","cancelled")')
        .gte('planned_start_time', now.toISOString())
        .lte('planned_start_time', soon.toISOString());

      if (error) throw error;
      if (!workItems) return;

      interface WorkItemData {
        id: number;
        title: string;
        planned_start_time?: string;
      }

      workItems.forEach((item: WorkItemData) => {
        const cacheId = `workitem-${item.id}`;
        if (!item.planned_start_time || remindedIds.current.has(cacheId)) return;

        showNotification(`🚀 团队任务即将开始: ${item.title}`, {
          body: `计划开始时间: ${new Date(item.planned_start_time).toLocaleString()}`,
          tag: cacheId,
        });
        saveRemindedIds(cacheId);
      });
    } catch (error) {
      console.error('Check upcoming work items failed:', error);
    }
  }, [userId, showNotification, saveRemindedIds]);


  // 统一运行器
  const runChecks = useCallback(() => {
    checkUpcomingSchedules();
    checkStagnantTasks();
    checkUpcomingWorkItems();
  }, [checkUpcomingSchedules, checkStagnantTasks, checkUpcomingWorkItems]);

  useEffect(() => {
    if (!userId) return;

    runChecks();
    const intervalId = setInterval(runChecks, 60000);

    return () => clearInterval(intervalId);
  }, [userId, runChecks]);

  return null;
}
