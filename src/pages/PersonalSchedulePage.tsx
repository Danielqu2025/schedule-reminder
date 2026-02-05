import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Trash2, CalendarDays, Clock, CheckCircle2, XCircle, Circle,
  Upload, File, X, Download, MessageSquarePlus,
  AlertTriangle, Bell, Tag as TagIcon
} from 'lucide-react';

import { supabase } from '../lib/supabaseClient';
import { Schedule, ScheduleUpdate, ScheduleAttachment } from '../types/database';
import { useToast } from '../hooks/useToast';
import { validateLength } from '../utils/validation';
import {
  uploadScheduleFile,
  downloadFile,
  formatFileSize,
  validateFileType,
  validateFileSize,
  getFileIcon
} from '../utils/fileUpload';
import { ScheduleListSkeleton } from '../components/Skeletons';
import './PersonalSchedulePage.css';

// 新增：日程表单接口
interface CreateScheduleForm {
  title: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  start_date: string;
  end_date?: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tags: string[];
  reminder_time?: string;
  reminder_type: 'email' | 'sms' | 'app';
}

export default function PersonalSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError, ToastContainer } = useToast();
  
  // 表单数据
  const [formData, setFormData] = useState<CreateScheduleForm>({
    title: '',
    priority: 'medium',
    start_date: '',
    end_date: '',
    description: '',
    status: 'pending',
    tags: [],
    reminder_time: '',
    reminder_type: 'app',
  });

  // 更新日程相关状态
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [updates, setUpdates] = useState<(ScheduleUpdate & { schedule_attachments?: ScheduleAttachment[] })[]>([]);
  const [updateContent, setUpdateContent] = useState('');
  const [updateStatus, setUpdateStatus] = useState<Schedule['status'] | ''>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSchedules = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('加载日程失败:', error);
      showError('加载日程失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    const titleValidation = validateLength(formData.title, 1, 100, '标题');
    if (!titleValidation.isValid) {
      showError(titleValidation.error || '验证失败');
      return;
    }

    if (!formData.start_date) {
      showError('请选择计划启动日期');
      return;
    }

    if (formData.end_date && formData.end_date < formData.start_date) {
      showError('完成日期不能早于启动日期');
      return;
    }

    if (submitting) return;
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
        title: formData.title,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        description: formData.description || null,
        status: formData.status,
        user_id: user.id,
      });

      if (error) throw error;

      setFormData({
        title: '',
        start_date: '',
        end_date: '',
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个日程吗？所有相关的更新记录和附件也将被删除。')) return;

    try {
      const { error } = await supabase.from('schedules').delete().eq('id', id);
      if (error) throw error;
      showSuccess('日程已删除');
      loadSchedules();
    } catch (error) {
      console.error('删除失败:', error);
      showError('删除失败，请重试');
    }
  };

  const handleStatusChange = async (id: number, newStatus: Schedule['status']) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      showSuccess('状态已更新');
      loadSchedules();
    } catch (error) {
      console.error('更新状态失败:', error);
      showError('更新状态失败，请重试');
    }
  };

  // ========== 更新功能 ==========
  
  const openUpdateModal = async (schedule: Schedule) => {
    setCurrentSchedule(schedule);
    setUpdateContent('');
    setUpdateStatus('');
    setSelectedFiles([]);
    setShowUpdateModal(true);
    await loadUpdates(schedule.id);
  };

  const loadUpdates = async (scheduleId: number) => {
    try {
      const { data, error } = await supabase
        .from('schedule_updates')
        .select(`
          *,
          schedule_attachments (*)
        `)
        .eq('schedule_id', scheduleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error('加载更新记录失败:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // 验证文件
    const validFiles: File[] = [];
    for (const file of files) {
      if (!validateFileType(file)) {
        showError(`不支持的文件类型: ${file.name}`);
        continue;
      }
      if (!validateFileSize(file)) {
        showError(`文件过大: ${file.name}`);
        continue;
      }
      validFiles.push(file);
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitUpdate = async () => {
    if (!currentSchedule) return;
    
    if (!updateContent.trim()) {
      showError('请输入更新内容');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showError('请先登录');
        return;
      }

      // 1. 插入更新记录
      const { data: updateData, error: updateError } = await supabase
        .from('schedule_updates')
        .insert({
          schedule_id: currentSchedule.id,
          user_id: user.id,
          content: updateContent,
          status: updateStatus || null,
        })
        .select()
        .single();

      if (updateError) throw updateError;

      // 2. 如果选择了新状态，同步更新日程状态
      if (updateStatus) {
        const { error: statusError } = await supabase
          .from('schedules')
          .update({ status: updateStatus })
          .eq('id', currentSchedule.id);
        
        if (statusError) throw statusError;
      }

      // 3. 上传附件
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const { path, error: uploadError } = await uploadScheduleFile(
            user.id,
            currentSchedule.id,
            updateData.id,
            file
          );

          if (uploadError) {
            console.error('文件上传失败:', uploadError);
            continue;
          }

          // 保存附件信息到数据库
          const { error: attachmentError } = await supabase
            .from('schedule_attachments')
            .insert({
              update_id: updateData.id,
              file_name: file.name,
              file_path: path,
              file_type: file.type,
              file_size: file.size,
            });

          if (attachmentError) {
            console.error('保存附件信息失败:', attachmentError);
          }
        }
      }

      showSuccess('更新已提交');
      setUpdateContent('');
      setUpdateStatus('');
      setSelectedFiles([]);
      loadUpdates(currentSchedule.id);
      loadSchedules(); // 刷新日程列表以显示新状态
    } catch (error) {
      console.error('提交更新失败:', error);
      showError('提交更新失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadAttachment = async (attachment: ScheduleAttachment) => {
    try {
      await downloadFile(attachment.file_path, attachment.file_name);
    } catch (error) {
      showError('下载失败');
    }
  };

  // ========== UI渲染辅助函数 ==========

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
    return <ScheduleListSkeleton />;
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
              <label>日程标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入日程标题"
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
              <label>计划启动日期 *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>计划完成日期（可选）</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
              />
            </div>
          </div>

          <div className="form-group">
            <label>描述（可选）</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="输入日程描述"
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
                  <span>
                    {schedule.start_date}
                    {schedule.end_date && ` 至 ${schedule.end_date}`}
                  </span>
                </div>
                {schedule.description && (
                  <div className="description">
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
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => openUpdateModal(schedule)}
                    className="btn-update-icon"
                    title="添加更新"
                  >
                    <MessageSquarePlus size={18} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="btn-delete-icon"
                    title="删除日程"
                  >
                    <Trash2 size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 更新日程模态框 */}
      {showUpdateModal && currentSchedule && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-content update-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentSchedule.title} - 更新记录</h3>
              <button onClick={() => setShowUpdateModal(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* 添加新更新 */}
              <div className="update-form">
                <h4>添加新更新</h4>
                <textarea
                  value={updateContent}
                  onChange={(e) => setUpdateContent(e.target.value)}
                  placeholder="记录当前阶段的进展、成果或遇到的问题..."
                  rows={4}
                  className="update-textarea"
                />

                <div className="form-row">
                  <div className="form-group">
                    <label>更新状态（可选）</label>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value as Schedule['status'] | '')}
                      className="status-select"
                    >
                      <option value="">保持当前状态</option>
                      <option value="pending">待办</option>
                      <option value="in_progress">进行中</option>
                      <option value="completed">已完成</option>
                      <option value="cancelled">已取消</option>
                    </select>
                  </div>
                </div>

                {/* 文件上传 */}
                <div className="file-upload-section">
                  <label>添加附件（可选）</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary"
                  >
                    <Upload size={16} />
                    选择文件
                  </button>
                  <span className="file-hint">支持图片、PDF、Word、Excel等文件，单个文件最大50MB</span>

                  {selectedFiles.length > 0 && (
                    <div className="selected-files">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="file-item">
                          <File size={16} />
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{formatFileSize(file.size)}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="btn-remove-file"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSubmitUpdate}
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? '提交中...' : '提交更新'}
                </button>
              </div>

              {/* 历史更新记录 */}
              <div className="updates-history">
                <h4>历史记录</h4>
                {updates.length === 0 ? (
                  <p className="empty-hint">暂无更新记录</p>
                ) : (
                  updates.map((update) => (
                    <div key={update.id} className="update-item">
                      <div className="update-header">
                        <span className="update-date">
                          {new Date(update.created_at).toLocaleString()}
                        </span>
                       {update.status && (
                           <span className={`status-badge status-${update.status}`}>
                             {getStatusIcon(update.status)}
                             {getStatusLabel(update.status)}
                           </span>
                         )}
                       </div>
                       <p className="update-content">{update.content}</p>

                       {update.schedule_attachments && update.schedule_attachments.length > 0 && (
                        <div className="attachments-list">
                          {update.schedule_attachments.map((attachment: ScheduleAttachment) => (
                            <div key={attachment.id} className="attachment-item">
                              <span className="file-icon">{getFileIcon(attachment.file_type || '')}</span>
                              <span className="attachment-name">{attachment.file_name}</span>
                              <span className="attachment-size">
                                {formatFileSize(attachment.file_size || 0)}
                              </span>
                              <button
                                onClick={() => handleDownloadAttachment(attachment)}
                                className="btn-download"
                                title="下载"
                              >
                                <Download size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
