import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CalendarDays, Clock, FileText, CheckCircle2, XCircle, Circle } from 'lucide-react';

import { supabase } from '../lib/supabaseClient';
import { Schedule } from '../types/database';
import { useToast } from '../hooks/useToast';
import { validateLength, validateDateRange } from '../utils/validation';
import './PersonalSchedulePage.css';

export default function PersonalSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError, ToastContainer } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    description: '',
    status: 'pending' as Schedule['status'],
  });

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('加载日程失败:', error);
      showError('加载日程失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    const titleValidation = validateLength(formData.title, 1, 100, '标题');
    if (!titleValidation.isValid) {
      showError(titleValidation.error || '验证失败');
      return;
    }

    const descriptionValidation = validateLength(formData.description || '', 0, 500, '描述');
    if (!descriptionValidation.isValid) {
      showError(descriptionValidation.error || '验证失败');
      return;
    }

    if (submitting) return; // 防止重复提交
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showError('请先登录');
        return;
      }

      const { error } = await supabase.from('schedules').insert({
        ...formData,
        user_id: user.id,
      });

      if (error) throw error;

      setFormData({
        title: '',
        date: '',
        time: '',
        description: '',
        status: 'pending',
      });
      setShowForm(false);
      showSuccess('日程添加成功！');
      loadSchedules();
    } catch (error) {
      console.error('添加日程失败:', error);
      const errorMessage = error instanceof Error ? error.message : '添加失败，请重试';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: Schedule['status']) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      showSuccess('状态更新成功');
      loadSchedules();
    } catch (error) {
      console.error('更新状态失败:', error);
      const errorMessage = error instanceof Error ? error.message : '更新失败，请重试';
      showError(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个日程吗？')) return;

    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      showSuccess('日程删除成功');
      loadSchedules();
    } catch (error) {
      console.error('删除日程失败:', error);
      const errorMessage = error instanceof Error ? error.message : '删除失败，请重试';
      showError(errorMessage);
    }
  };

  const getStatusLabel = (status: Schedule['status']) => {
    const labels = {
      pending: '待办',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status];
  };

  const getStatusIcon = (status: Schedule['status']) => {
    const icons = {
      pending: <Circle size={14} />,
      in_progress: <Clock size={14} />,
      completed: <CheckCircle2 size={14} />,
      cancelled: <XCircle size={14} />,
    };
    return icons[status];
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="personal-schedule-page">
      <div className="page-header">
        <h2>个人日程管理</h2>
        <button onClick={() => setShowForm(!showForm)} className="add-btn">
          {showForm ? <XCircle size={18} /> : <Plus size={18} />}
          <span>{showForm ? '取消' : '添加日程'}</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="schedule-form">
          <div className="form-row">
            <div className="form-group">
              <label>标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label>状态</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as Schedule['status'] })
                }
              >
                <option value="pending">待办</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>日期 *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="form-group">
              <label>时间 *</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              maxLength={500}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? '添加中...' : '添加日程'}
          </button>
        </form>
      )}

      <div className="schedules-grid">
        {schedules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CalendarDays size={48} strokeWidth={1.5} />
            </div>
            <p>暂无日程安排，点击上方按钮开始记录</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="schedule-card fade-in">
              <div className="schedule-header">
                <h3>{schedule.title}</h3>
                <span className={`status-badge status-${schedule.status}`}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    {getStatusIcon(schedule.status)}
                    {getStatusLabel(schedule.status)}
                  </span>
                </span>
              </div>
              
              <div className="schedule-info">
                <div className="info-row">
                  <Clock size={14} />
                  <span>{schedule.date} {schedule.time}</span>
                </div>
                {schedule.description && (
                  <div className="info-row description">
                    <p>{schedule.description}</p>
                  </div>
                )}
              </div>

              <div className="schedule-footer">
                <select
                  value={schedule.status}
                  onChange={(e) =>
                    handleStatusChange(schedule.id, e.target.value as Schedule['status'])
                  }
                  className="status-select-premium"
                >
                  <option value="pending">待办</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="btn-delete-icon"
                  title="删除日程"
                >
                  <Trash2 size={18} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
