import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { WorkItem, Task, TaskComment } from '../types/database';
import './WorkItemPage.css';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, addHours, differenceInHours, parseISO } from 'date-fns';

interface TeamMember {
  id: string;
  email?: string;
  name?: string;
}

export default function WorkItemPage() {
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');
  const navigate = useNavigate();
  const { showSuccess, showError, ToastContainer } = useToast();
  
  const [task, setTask] = useState<Task | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    execution_order: 'parallel' as 'parallel' | 'sequential',
    assignee_id: '',
    planned_start_time: '',
    duration_hours: '',
    planned_end_time: '',
    objectives: '',
    collaborators: [] as string[],
  });

  const [timeInputMode, setTimeInputMode] = useState<'duration' | 'endTime'>('duration');
  const [commentContent, setCommentContent] = useState('');

  useEffect(() => {
    if (taskId) {
      loadData();

      // 设置实时监听
      const channel = supabase
        .channel(`task-${taskId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'work_items', filter: `task_id=eq.${taskId}` },
          () => loadData()
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'task_comments', filter: `task_id=eq.${taskId}` },
          () => loadData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [taskId]);


  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // 1. Fetch Task - 先验证用户是否有权限访问此任务
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();
      
      if (taskError) throw taskError;
      
      // 验证用户是否属于该任务的团队
      if (taskData.team_id) {
        const { data: memberCheck } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('team_id', taskData.team_id)
          .eq('user_id', user.id)
          .single();
        
        if (!memberCheck) {
          showError('您没有权限访问此任务');
          navigate('/tasks');
          return;
        }
      }
      
      setTask(taskData);

      // 2. Fetch Work Items
      const { data: itemsData, error: itemsError } = await supabase
        .from('work_items')
        .select('*')
        .eq('task_id', taskId)
        .order('sequence_number', { ascending: true });
      
      if (itemsError) throw itemsError;
      setWorkItems(itemsData || []);

      // 3. Fetch Comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      
      if (commentsError) throw commentsError;
      setComments(commentsData || []);

      // 4. Fetch Team Members for assignment
      if (taskData.team_id) {
        const { data: memberData } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', taskData.team_id);
        setTeamMembers(memberData || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : '加载失败，请重试';
      showError(errorMessage);
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeCalculation = useCallback((field: 'duration' | 'endTime', value: string) => {
    if (!formData.planned_start_time) return;

    try {
      const start = parseISO(formData.planned_start_time);
      if (field === 'duration') {
        const hours = parseFloat(value);
        if (!isNaN(hours)) {
          const end = addHours(start, hours);
          setFormData(prev => ({ 
            ...prev, 
            duration_hours: value, 
            planned_end_time: format(end, "yyyy-MM-dd'T'HH:mm") 
          }));
        } else {
          setFormData(prev => ({ ...prev, duration_hours: value }));
        }
      } else {
        const end = parseISO(value);
        const hours = differenceInHours(end, start);
        setFormData(prev => ({ 
          ...prev, 
          planned_end_time: value, 
          duration_hours: hours > 0 ? hours.toString() : '0' 
        }));
      }
    } catch (e) {
      console.error('Time calculation error:', e);
    }
  }, [formData.planned_start_time]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId) return;

    // 表单验证
    const titleValidation = validateLength(formData.title, 1, 255, '工作子项标题');
    if (!titleValidation.isValid) {
      showError(titleValidation.error || '验证失败');
      return;
    }

    if (submitting) return; // 防止重复提交
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('请先登录');
        return;
      }

      const seqNum = workItems.length + 1;

      const { error } = await supabase.from('work_items').insert({
        task_id: parseInt(taskId),
        title: formData.title,
        description: formData.description,
        execution_order: formData.execution_order,
        sequence_number: seqNum,
        assignee_id: formData.assignee_id || null,
        planned_start_time: formData.planned_start_time || null,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
        planned_end_time: formData.planned_end_time || null,
        objectives: formData.objectives,
        collaborators: JSON.stringify(formData.collaborators),
        created_by: user.id,
        status: 'pending',
        progress: 0
      });

      if (error) throw error;

      setFormData({ 
        title: '', 
        description: '', 
        execution_order: 'parallel', 
        assignee_id: '',
        planned_start_time: '',
        duration_hours: '',
        planned_end_time: '',
        objectives: '',
        collaborators: []
      });
      showSuccess('工作子项添加成功！');
      loadData();
    } catch (error) {
      console.error('添加工作子项失败:', error);
      const errorMessage = error instanceof Error ? error.message : '添加失败，请重试';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgress = async (id: number, currentProgress: number) => {
    const nextProgress = Math.min(100, currentProgress + 10);
    const newStatus = nextProgress === 100 ? 'completed' : 'in_progress';

    try {
      const { error } = await supabase
        .from('work_items')
        .update({ progress: nextProgress, status: newStatus })
        .eq('id', id);

      if (error) throw error;
      showSuccess('进度更新成功');
      loadData();
    } catch (error) {
      console.error('更新进度失败:', error);
      const errorMessage = error instanceof Error ? error.message : '更新失败，请重试';
      showError(errorMessage);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !taskId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('task_comments').insert({
        task_id: parseInt(taskId),
        user_id: user.id,
        content: commentContent.trim()
      });

      if (error) throw error;
      setCommentContent('');
      showSuccess('评论添加成功');
      loadData();
    } catch (error) {
      console.error('评论失败:', error);
      const errorMessage = error instanceof Error ? error.message : '评论失败，请重试';
      showError(errorMessage);
    }
  };

  // 阶段分组逻辑
  interface GroupedWorkItem {
    type: 'parallel' | 'sequential';
    items: WorkItem[];
  }

  const groupedWorkItems = workItems.reduce((acc: GroupedWorkItem[], item) => {
    if (item.execution_order === 'parallel') {
      acc.push({ type: 'parallel', items: [item] });
    } else {
      const lastGroup = acc[acc.length - 1];
      if (lastGroup && lastGroup.type === 'sequential') {
        lastGroup.items.push(item);
      } else {
        acc.push({ type: 'sequential', items: [item] });
      }
    }
    return acc;
  }, []);


  if (loading) return <div className="loading" style={{ textAlign: 'center', padding: '100px', color: '#6b7280' }}>加载中...</div>;
  if (!taskId) return <div className="empty-state" style={{ textAlign: 'center', padding: '100px', color: '#6b7280' }}>请通过任务列表进入此页面</div>;

  return (

    <div className="work-item-page">
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/tasks')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#4f46e5', 
            cursor: 'pointer', 
            padding: '8px 0',
            fontSize: '0.9rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          ← 返回任务列表
        </button>
      </div>
      
      <div className="task-context">
        <span style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 600, display: 'block', marginBottom: '5px' }}>当前任务</span>
        <h2 style={{ fontSize: '1.5rem', margin: '0 0 8px 0', color: '#111827' }}>{task?.title || '未知任务'}</h2>
        <p style={{ fontSize: '0.95rem', color: '#6b7280' }}>{task?.description || '无任务描述'}</p>
      </div>

      <div className="work-items-container">
        <div className="items-list-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>工作分解结构 (WBS)</h3>
            <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>共 {workItems.length} 个子项</span>
          </div>
          
          <div className="items-list">
            {groupedWorkItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', border: '2px dashed #f3f4f6', borderRadius: '12px', color: '#9ca3af' }}>
                <p>尚未分解任何工作子项</p>
                <p style={{ fontSize: '0.8rem' }}>使用右侧表单开始拆分任务</p>
              </div>
            ) : (
              groupedWorkItems.map((group, gIndex) => (
                <div key={gIndex} className={`work-stage-group group-${group.type}`}>
                  <div className="group-label">
                    {group.type === 'parallel' ? '⚡ 并行执行阶段' : '🔗 顺序执行阶段'}
                  </div>
                  <div className="group-items">
                    {group.items.map((item: WorkItem) => (
                      <div key={item.id} className="work-item-card fade-in">
                        <div className="item-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className={`item-badge badge-${item.execution_order}`}>
                              {item.execution_order === 'parallel' ? '并行' : `#${item.sequence_number}`}
                            </span>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: '#1f2937' }}>{item.title}</h4>
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#4b5563' }}>{item.progress}%</span>
                        </div>
                        
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: `${item.progress}%` }}></div>
                        </div>

                        <div className="item-meta">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.status === 'completed' ? 'var(--success)' : 'var(--warning)' }}></span>
                            {item.status === 'completed' ? '已完成' : item.status === 'in_progress' ? '进行中' : '待办'}
                          </span>
                          {item.assignee_id && (
                            <span title={item.assignee_id}>👤 {item.assignee_id.slice(0, 8)}</span>
                          )}
                        </div>
                        
                        {(item.planned_start_time || item.duration_hours || item.objectives) && (
                          <div className="item-details-preview" style={{ marginTop: '10px', fontSize: '0.8rem', color: '#6b7280', borderTop: '1px solid #f3f4f6', paddingTop: '8px' }}>
                            {item.planned_start_time && (
                              <div style={{ marginBottom: '4px' }}>📅 开始: {new Date(item.planned_start_time).toLocaleString()}</div>
                            )}
                            {item.duration_hours && (
                              <div style={{ marginBottom: '4px' }}>⏱️ 预计耗时: {item.duration_hours}h {item.planned_end_time && `(至 ${new Date(item.planned_end_time).toLocaleTimeString()})`}</div>
                            )}
                            {item.objectives && (
                              <div style={{ marginTop: '5px', background: '#f9fafb', padding: '6px', borderRadius: '4px' }}>
                                <strong>目标:</strong> {item.objectives}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="item-actions" style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => handleUpdateProgress(item.id, item.progress)}
                            disabled={item.status === 'completed'}
                            className="btn-update-progress"
                            style={{ 
                              background: item.status === 'completed' ? '#f3f4f6' : 'var(--primary-glow)', 
                              color: item.status === 'completed' ? '#9ca3af' : 'var(--primary)', 
                              border: 'none', 
                              padding: '6px 16px', 
                              borderRadius: '8px', 
                              cursor: item.status === 'completed' ? 'default' : 'pointer', 
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              transition: 'all 0.2s'
                            }}
                          >
                            {item.status === 'completed' ? '已完成' : '更新进度 +10%'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        <div className="add-item-sidebar">
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.1rem' }}>拆分新子项</h3>
          <form onSubmit={handleAddItem}>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>子项标题 *</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                placeholder="例如：编写接口文档"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>执行方式</label>
              <select 
                value={formData.execution_order} 
                onChange={(e) => setFormData({...formData, execution_order: e.target.value as 'parallel' | 'sequential'})}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', backgroundColor: 'white' }}
              >
                <option value="parallel">并行 (所有子项可同时进行)</option>
                <option value="sequential">顺序 (需按序号依次完成)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>负责人</label>
              <select 
                value={formData.assignee_id} 
                onChange={(e) => setFormData({...formData, assignee_id: e.target.value})}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem', backgroundColor: 'white' }}
              >
                <option value="">选择负责人</option>
                {teamMembers.map(m => (
                  <option key={m.user_id} value={m.user_id}>用户 {m.user_id.slice(0, 8)}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>开始时间</label>
              <input 
                type="datetime-local" 
                value={formData.planned_start_time} 
                onChange={(e) => setFormData({...formData, planned_start_time: e.target.value})}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
              />
            </div>

            <div className="time-mode-toggle" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button 
                type="button"
                onClick={() => setTimeInputMode('duration')}
                style={{ flex: 1, padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #4f46e5', background: timeInputMode === 'duration' ? '#4f46e5' : 'white', color: timeInputMode === 'duration' ? 'white' : '#4f46e5', cursor: 'pointer' }}
              >
                预计时长
              </button>
              <button 
                type="button"
                onClick={() => setTimeInputMode('endTime')}
                style={{ flex: 1, padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #4f46e5', background: timeInputMode === 'endTime' ? '#4f46e5' : 'white', color: timeInputMode === 'endTime' ? 'white' : '#4f46e5', cursor: 'pointer' }}
              >
                完成时间
              </button>
            </div>

            {timeInputMode === 'duration' ? (
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>预计时长 (小时)</label>
                <input 
                  type="number" 
                  step="0.5"
                  value={formData.duration_hours} 
                  onChange={(e) => handleTimeCalculation('duration', e.target.value)}
                  placeholder="小时"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
                />
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>计划完成时间</label>
                <input 
                  type="datetime-local" 
                  value={formData.planned_end_time} 
                  onChange={(e) => handleTimeCalculation('endTime', e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.9rem' }}
                />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>工作目标 (验收标准)</label>
              <textarea 
                value={formData.objectives} 
                onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                placeholder="明确交付物和验收标准..."
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', height: '80px', fontSize: '0.9rem', resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>配合人</label>
              <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '6px', padding: '10px' }}>
                {teamMembers.map(m => (
                  <label key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.collaborators.includes(m.user_id)}
                      onChange={(e) => {
                        const newCols = e.target.checked 
                          ? [...formData.collaborators, m.user_id]
                          : formData.collaborators.filter(id => id !== m.user_id);
                        setFormData({...formData, collaborators: newCols});
                      }}
                    />
                    用户 {m.user_id.slice(0, 8)}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: '#374151' }}>任务说明</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="该步骤的具体要求..."
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', height: '100px', fontSize: '0.9rem', resize: 'vertical' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ 
                width: '100%', 
                background: submitting ? '#9ca3af' : '#4f46e5', 
                color: 'white', 
                border: 'none', 
                padding: '12px', 
                borderRadius: '8px', 
                cursor: submitting ? 'not-allowed' : 'pointer', 
                fontWeight: 600, 
                fontSize: '0.95rem',
                transition: 'all 0.2s'
              }}
            >
              {submitting ? '添加中...' : '确认添加'}
            </button>
          </form>
        </div>
      </div>

      <div className="comments-section">
        <h3>讨论与备注</h3>
        <form onSubmit={handlePostComment} className="comment-form">
          <textarea 
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            placeholder="发表评论或同步工作进展..."
          />
          <button type="submit" className="submit-btn" style={{ width: 'auto', padding: '10px 30px' }}>发表评论</button>
        </form>

        <div className="comments-list" style={{ marginTop: '30px' }}>
          {comments.length === 0 ? (
            <p style={{ color: '#9ca3af', textAlign: 'center' }}>暂无讨论</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-user">用户 {comment.user_id.slice(0, 8)}</span>
                  <span className="comment-date">{new Date(comment.created_at).toLocaleString()}</span>
                </div>
                <div className="comment-content">{comment.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
