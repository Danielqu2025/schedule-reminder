import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Circle, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Schedule, Task, WorkItem } from '../types/database';
import { 
  startOfToday, endOfToday, 
  startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, 
  format, isWithinInterval,
  isBefore, parseISO
} from 'date-fns';
import './StatisticsPage.css';

interface Stats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

interface TeamStats {
  totalTasks: number;
  taskCompletionRate: number;
  onTimeRate: number;
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  workload: {
    pending: number;
    in_progress: number;
    completed: number;
  };
}

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'team'>('personal');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  
  const [personalStats, setPersonalStats] = useState<Stats>({
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    completionRate: 0,
  });

  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalTasks: 0,
    taskCompletionRate: 0,
    onTimeRate: 0,
    priorityBreakdown: { high: 0, medium: 0, low: 0 },
    workload: { pending: 0, in_progress: 0, completed: 0 }
  });

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load Schedules
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id);
      
      if (scheduleData) setSchedules(scheduleData);

      // Load Tasks (Assuming user has access to team tasks via RLS)
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*');
      
      if (taskData) setTasks(taskData);

      // Load WorkItems
      const { data: workItemData } = await supabase
        .from('work_items')
        .select('*');

      if (workItemData) setWorkItems(workItemData);

    } catch (error) {
      console.error('加载数据失败:', error);
      // 统计页面错误不显示 Toast，避免干扰
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calculateStats = useCallback(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);

    // --- Personal Stats Calculation ---
    const filteredSchedules = schedules.filter(s => {
      const sDate = new Date(s.date);
      return isWithinInterval(sDate, { start, end });
    });

    const pCounts = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    filteredSchedules.forEach(s => {
      if (s.status in pCounts) {
        pCounts[s.status as keyof typeof pCounts]++;
      }
    });

    const pTotal = filteredSchedules.length;
    const pActive = pCounts.pending + pCounts.in_progress;
    const pCompletionRate = (pCounts.completed + pActive) > 0 
      ? Math.round((pCounts.completed / (pCounts.completed + pActive)) * 100)
      : pTotal > 0 ? 100 : 0;

    setPersonalStats({
      total: pTotal,
      ...pCounts,
      completionRate: pCompletionRate,
    });

    // --- Team Stats Calculation ---
    // Filter tasks by date range (using created_at or updated_at or start_date/end_date)
    // Here we use created_at for simplicity of "tasks in this period"
    const filteredTasks = tasks.filter(t => {
      const tDate = new Date(t.created_at);
      return isWithinInterval(tDate, { start, end });
    });

    const tCounts = {
      high: 0,
      medium: 0,
      low: 0,
    };
    
    let completedTasks = 0;
    let onTimeTasks = 0;
    let totalCompletedTasks = 0;

    filteredTasks.forEach(t => {
      if (t.priority in tCounts) {
        tCounts[t.priority as keyof typeof tCounts]++;
      }
      if (t.status === 'completed') {
        completedTasks++;
        totalCompletedTasks++;
        // Check on-time
        if (t.end_date && t.updated_at) {
           if (isBefore(parseISO(t.updated_at), parseISO(t.end_date))) {
             onTimeTasks++;
           }
        }
      }
    });

    const taskCompletionRate = filteredTasks.length > 0 
      ? Math.round((completedTasks / filteredTasks.length) * 100) 
      : 0;
      
    const onTimeRate = totalCompletedTasks > 0
      ? Math.round((onTimeTasks / totalCompletedTasks) * 100)
      : 100; // Default to 100 if no completed tasks to judge

    // Workload (WorkItems assigned to user or generally in team)
    // For team view, we might want overall status distribution of work items
    const wCounts = {
      pending: 0,
      in_progress: 0,
      completed: 0
    };

    const filteredWorkItems = workItems.filter(w => {
       const wDate = new Date(w.created_at);
       return isWithinInterval(wDate, { start, end });
    });

    filteredWorkItems.forEach(w => {
      if (['pending', 'blocked'].includes(w.status)) wCounts.pending++;
      if (w.status === 'in_progress') wCounts.in_progress++;
      if (w.status === 'completed') wCounts.completed++;
    });

    setTeamStats({
      totalTasks: filteredTasks.length,
      taskCompletionRate,
      onTimeRate,
      priorityBreakdown: tCounts,
      workload: wCounts
    });

  }, [schedules, tasks, workItems, dateRange]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const handleQuickRange = (range: 'today' | 'week' | 'month') => {
    const now = new Date();
    let start, end;
    if (range === 'today') {
      start = startOfToday();
      end = endOfToday();
    } else if (range === 'week') {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
    } else {
      start = startOfMonth(now);
      end = endOfMonth(now);
    }
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    });
  };

  if (loading) return <div className="loading">加载中...</div>;

  const maxCount = Math.max(personalStats.pending, personalStats.in_progress, personalStats.completed, personalStats.cancelled, 1);

  return (
    <div className="statistics-page">
      <div className="page-header">
        <h2>统计分析</h2>
        <div className="stats-tabs">
          <button 
            className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            个人日程
          </button>
          <button 
            className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            团队项目
          </button>
        </div>
      </div>

      <div className="stats-controls">
        <div className="date-inputs">
          <label>日期范围:</label>
          <input 
            type="date" 
            value={dateRange.start} 
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <span>至</span>
          <input 
            type="date" 
            value={dateRange.end} 
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
        </div>
        <div className="quick-ranges">
          <button onClick={() => handleQuickRange('today')} className="quick-btn">今天</button>
          <button onClick={() => handleQuickRange('week')} className="quick-btn">本周</button>
          <button onClick={() => handleQuickRange('month')} className="quick-btn">本月</button>
        </div>
      </div>

      {activeTab === 'personal' ? (
        <>
          <div className="completion-rate-container">
            <div className="completion-rate-circle">
              <span className="rate">{personalStats.completionRate}%</span>
              <span className="text">完成率</span>
            </div>
          </div>

          <div className="stats-summary">
            <div className="stats-card">
              <h4>总任务数</h4>
              <div className="count">{personalStats.total}</div>
              <div className="label">所选时段内</div>
            </div>
            <div className="stats-card" style={{ borderBottom: '4px solid #ffd700' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <Circle size={16} /> 待办
              </h4>
              <div className="count">{personalStats.pending}</div>
            </div>
            <div className="stats-card" style={{ borderBottom: '4px solid #3498db' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <BarChart3 size={16} /> 进行中
              </h4>
              <div className="count">{personalStats.in_progress}</div>
            </div>
            <div className="stats-card" style={{ borderBottom: '4px solid #2ecc71' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <CheckCircle2 size={16} /> 已完成
              </h4>
              <div className="count">{personalStats.completed}</div>
            </div>
            <div className="stats-card" style={{ borderBottom: '4px solid #e74c3c' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                <XCircle size={16} /> 已取消
              </h4>
              <div className="count">{personalStats.cancelled}</div>
            </div>
          </div>

          <div className="stats-chart">
            <h3>状态分布</h3>
            <div className="chart-container">
              <div className="bar-group">
                <div className="bar bar-pending" style={{ height: `${(personalStats.pending / maxCount) * 100}%` }}>
                  <span className="bar-count">{personalStats.pending}</span>
                </div>
                <div className="bar-label">待办</div>
              </div>
              <div className="bar-group">
                <div className="bar bar-in-progress" style={{ height: `${(personalStats.in_progress / maxCount) * 100}%` }}>
                  <span className="bar-count">{personalStats.in_progress}</span>
                </div>
                <div className="bar-label">进行中</div>
              </div>
              <div className="bar-group">
                <div className="bar bar-completed" style={{ height: `${(personalStats.completed / maxCount) * 100}%` }}>
                  <span className="bar-count">{personalStats.completed}</span>
                </div>
                <div className="bar-label">已完成</div>
              </div>
              <div className="bar-group">
                <div className="bar bar-cancelled" style={{ height: `${(personalStats.cancelled / maxCount) * 100}%` }}>
                  <span className="bar-count">{personalStats.cancelled}</span>
                </div>
                <div className="bar-label">已取消</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="team-stats-container">
          <div className="team-metrics-grid">
            <div className="metric-card primary">
              <div className="metric-value">{teamStats.taskCompletionRate}%</div>
              <div className="metric-label">任务完成率</div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: `${teamStats.taskCompletionRate}%` }}></div>
              </div>
            </div>
            <div className="metric-card success">
              <div className="metric-value">{teamStats.onTimeRate}%</div>
              <div className="metric-label">按时交付率</div>
              <div className="metric-bar">
                <div className="metric-fill" style={{ width: `${teamStats.onTimeRate}%` }}></div>
              </div>
            </div>
            <div className="metric-card info">
              <div className="metric-value">{teamStats.totalTasks}</div>
              <div className="metric-label">总任务数</div>
            </div>
          </div>

          <div className="charts-row">
            <div className="stats-chart priority-chart">
              <h3>优先级分布</h3>
              <div className="chart-container">
                <div className="bar-group">
                  <div className="bar bar-high" style={{ height: `${(teamStats.priorityBreakdown.high / Math.max(1, teamStats.totalTasks)) * 100}%` }}>
                    <span className="bar-count">{teamStats.priorityBreakdown.high}</span>
                  </div>
                  <div className="bar-label">高</div>
                </div>
                <div className="bar-group">
                  <div className="bar bar-medium" style={{ height: `${(teamStats.priorityBreakdown.medium / Math.max(1, teamStats.totalTasks)) * 100}%` }}>
                    <span className="bar-count">{teamStats.priorityBreakdown.medium}</span>
                  </div>
                  <div className="bar-label">中</div>
                </div>
                <div className="bar-group">
                  <div className="bar bar-low" style={{ height: `${(teamStats.priorityBreakdown.low / Math.max(1, teamStats.totalTasks)) * 100}%` }}>
                    <span className="bar-count">{teamStats.priorityBreakdown.low}</span>
                  </div>
                  <div className="bar-label">低</div>
                </div>
              </div>
            </div>

            <div className="stats-chart workload-chart">
              <h3>工作项状态</h3>
              <div className="chart-container">
                <div className="bar-group">
                  <div className="bar bar-pending" style={{ height: `${(teamStats.workload.pending / Math.max(1, teamStats.workload.pending + teamStats.workload.in_progress + teamStats.workload.completed)) * 100}%` }}>
                    <span className="bar-count">{teamStats.workload.pending}</span>
                  </div>
                  <div className="bar-label">待办</div>
                </div>
                <div className="bar-group">
                  <div className="bar bar-in-progress" style={{ height: `${(teamStats.workload.in_progress / Math.max(1, teamStats.workload.pending + teamStats.workload.in_progress + teamStats.workload.completed)) * 100}%` }}>
                    <span className="bar-count">{teamStats.workload.in_progress}</span>
                  </div>
                  <div className="bar-label">进行中</div>
                </div>
                <div className="bar-group">
                  <div className="bar bar-completed" style={{ height: `${(teamStats.workload.completed / Math.max(1, teamStats.workload.pending + teamStats.workload.in_progress + teamStats.workload.completed)) * 100}%` }}>
                    <span className="bar-count">{teamStats.workload.completed}</span>
                  </div>
                  <div className="bar-label">已完成</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
