import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Clock, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Task, Team, WorkGroup } from '../types/database';
import { useToast } from '../hooks/useToast';
import { validateLength, validateDateRange } from '../utils/validation';
import './TaskManagementPage.css';

interface TeamMemberWithTeam {
  team_id: number;
  teams: Team | null;
}

export default function TaskManagementPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError, ToastContainer } = useToast();
  
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [formData, setFormData] = useState({
    team_id: '',
    work_group_id: '',
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [teamFilter, statusFilter]);

  const loadInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberData } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams (id, name, description, owner_id, created_at)
        `)
        .eq('user_id', user.id);

      const teamsData = (memberData || [])
        .map((item: TeamMemberWithTeam) => item.teams)
        .filter((team: Team | null): team is Team => team !== null);
      
      setTeams(teamsData || []);
    } catch (error) {
      console.error('加载基础数据失败:', error);
      showError('加载基础数据失败');
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberData } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      const userTeamIds = (memberData || []).map(m => m.team_id);
      
      if (userTeamIds.length === 0) {
        setTasks([]);
        return;
      }

      let query = supabase
        .from('tasks')
        .select('*')
        .in('team_id', userTeamIds);
      
      if (teamFilter !== 'all') {
        query = query.eq('team_id', teamFilter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('加载任务失败:', error);
      showError('加载任务失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamChangeInForm = async (teamId: string) => {
    setFormData({ ...formData, team_id: teamId, work_group_id: '' });
    if (teamId) {
      const { data } = await supabase.from('work_groups').select('*').eq('team_id', teamId);
      setWorkGroups(data || []);
    } else {
      setWorkGroups([]);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!formData.team_id) {
      showError('请选择目标团队');
      return;
    }

    const titleValidation = validateLength(formData.title, 1, 255, '任务标题');
    if (!titleValidation.isValid) {
      showError(titleValidation.error || '验证失败');
      return;
    }

    if (formData.start_date && formData.end_date) {
      const dateValidation = validateDateRange(formData.start_date, formData.end_date);
      if (!dateValidation.isValid) {
        showError(dateValidation.error || '验证失败');
        return;
      }
    }

    if (submitting) return; // 防止重复提交
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('请先登录');
        return;
      }

      const { error } = await supabase.from('tasks').insert({
        team_id: parseInt(formData.team_id),
        work_group_id: formData.work_group_id ? parseInt(formData.work_group_id) : null,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        created_by: user.id,
        status: 'pending'
      });

      if (error) throw error;

      setShowForm(false);
      setFormData({
        team_id: '',
        work_group_id: '',
        title: '',
        description: '',
        priority: 'medium',
        start_date: '',
        end_date: '',
      });
      showSuccess('任务创建成功！');
      loadTasks();
    } catch (error) {
      console.error('创建任务失败:', error);
      const errorMessage = error instanceof Error ? error.message : '创建任务失败，请重试';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityLabel = (p: Task['priority']) => {
    const labels = { low: '低', medium: '中', high: '高' };
    return labels[p];
  };

  const getStatusLabel = (s: Task['status']) => {
    const labels = { pending: '待办', in_progress: '进行中', completed: '已完成', cancelled: '已取消' };
    return labels[s];
  };

  return (
    <div className="task-management-page fade-in">
      <div className="page-header-premium">
        <div className="header-info">
          <h1>任务工作台</h1>
          <p>规划、执行并交付团队目标</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? '取消' : '+ 创建新任务'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateTask} className="task-form-premium card slide-in">
          <div className="form-grid-premium">
            <div className="form-group">
              <label>目标团队 *</label>
              <select 
                value={formData.team_id} 
                onChange={(e) => handleTeamChangeInForm(e.target.value)}
                required
                className="input-field"
              >
                <option value="">选择团队</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>执行小组</label>
              <select 
                value={formData.work_group_id} 
                onChange={(e) => setFormData({ ...formData, work_group_id: e.target.value })}
                disabled={!formData.team_id}
                className="input-field"
              >
                <option value="">所有小组</option>
                {workGroups.map(wg => <option key={wg.id} value={wg.id}>{wg.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>任务标题 *</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="input-field"
              placeholder="简述任务核心内容"
            />
          </div>

          <div className="form-grid-three">
            <div className="form-group">
              <label>优先级</label>
              <select 
                value={formData.priority} 
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                className="input-field"
              >
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
            <div className="form-group">
              <label>启动日期</label>
              <input 
                type="date" 
                value={formData.start_date} 
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>交付截止</label>
              <input 
                type="date" 
                value={formData.end_date} 
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="input-field"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={submitting}
          >
            {submitting ? '发布中...' : '发布任务'}
          </button>
        </form>
      )}

      <div className="filters-row-premium">
        <div className="filter-item">
          <span>团队:</span>
          <select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="select-premium">
            <option value="all">全量团队</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="filter-item">
          <span>状态:</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select-premium">
            <option value="all">全量状态</option>
            <option value="pending">待办</option>
            <option value="in_progress">进行中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
      </div>

      <div className="tasks-container-premium">
        {loading ? (
          <div className="loading-msg">正在同步云端数据...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state-tasks glass-card">
            <div className="empty-icon">📂</div>
            <p>没有找到相关任务</p>
          </div>
        ) : (
          <div className="tasks-grid-premium">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className="task-card-premium card slide-in"
                onClick={() => navigate(`/work-items?taskId=${task.id}`)}
              >
                <div className="task-header-row">
                  <span className={`priority-tag priority-${task.priority}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                  <span className={`status-pill status-${task.status}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>
                <h3 className="task-title-premium">{task.title}</h3>
                <div className="task-info-footer">
                  <div className="info-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Layers size={14} /> {teams.find(t => t.id === task.team_id)?.name || '未知团队'}
                  </div>
                  {task.end_date && (
                    <div className="info-tag danger" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} /> {task.end_date} 截止
                    </div>
                  )}
                </div>
                <div className="task-action-hint">查看 WBS 分解</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}

