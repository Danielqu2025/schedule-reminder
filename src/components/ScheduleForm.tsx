/**
 * 日程创建表单组件 - 包含优先级、标签、提醒设置
 */

import React, { useState } from 'react';
import { AlertTriangle, Bell, Tag as TagIcon, X } from 'lucide-react';

interface ScheduleFormProps {
  onSubmit: (data: CreateScheduleFormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

interface CreateScheduleFormData {
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

export default function ScheduleForm({ onSubmit, onCancel, submitting }: ScheduleFormProps) {
  const [formData, setFormData] = useState<CreateScheduleFormData>({
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

  const [tagInput, setTagInput] = useState('');

  const priorityOptions = [
    { value: 'urgent', label: '紧急', color: '#ef4444', icon: <AlertTriangle size={16} /> },
    { value: 'high', label: '高', color: '#f97316', icon: <AlertTriangle size={16} /> },
    { value: 'medium', label: '中', color: '#f59e0b', icon: <AlertTriangle size={16} /> },
    { value: 'low', label: '低', color: '#10b981', icon: <AlertTriangle size={16} /> },
  ];

  const reminderOptions = [
    { value: 'app', label: '应用内通知' },
    { value: 'email', label: '邮件提醒' },
    { value: 'sms', label: '短信提醒' },
  ];

  const commonTags = ['工作', '学习', '健康', '家庭', '重要', '紧急', '待办', '计划'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <form onSubmit={handleSubmit} className="schedule-form-enhanced">
      {/* 优先级和标题 */}
      <div className="form-row-title-row">
        <div className="form-group priority-group">
          <label>优先级 *</label>
          <div className="priority-options">
            {priorityOptions.map(option => (
              <label
                key={option.value}
                className={`priority-option ${formData.priority === option.value ? 'active' : ''}`}
                style={{ '--priority-color': option.color }}
              >
                <input
                  type="radio"
                  name="priority"
                  value={option.value}
                  checked={formData.priority === option.value}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                />
                {option.icon}
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="form-group title-group">
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
      </div>

      {/* 日期范围 */}
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
          <label>计划完成日期</label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            min={formData.start_date}
          />
        </div>
      </div>

      {/* 标签输入 */}
      <div className="form-group">
        <label>标签</label>
        <div className="tags-container">
          {formData.tags.map(tag => (
            <span key={tag} className="tag-badge">
              <TagIcon size={12} />
              {tag}
              <button
                type="button"
                className="tag-remove"
                onClick={() => removeTag(tag)}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <div className="tag-input-container">
            <TagIcon size={16} className="tag-icon" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  addTag(tagInput.trim());
                }
              }}
              placeholder="输入标签后回车添加"
              maxLength={20}
            />
            <div className="tag-suggestions">
              {commonTags
                .filter(tag => !formData.tags.includes(tag) && tag.includes(tagInput))
                .slice(0, 5)
                .map(tag => (
                  <button
                    key={tag}
                    type="button"
                    className="tag-suggestion"
                    onClick={() => addTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 提醒设置 */}
      <div className="form-row reminder-row">
        <div className="form-group">
          <label>提醒方式</label>
          <select
            value={formData.reminder_type}
            onChange={(e) => setFormData({ ...formData, reminder_type: e.target.value as any })}
          >
            {reminderOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>提醒时间</label>
          <div className="time-input-with-icon">
            <Bell size={16} />
            <input
              type="datetime-local"
              value={formData.reminder_time}
              onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
              min={formData.start_date}
            />
          </div>
        </div>
      </div>

      {/* 描述 */}
      <div className="form-group">
        <label>描述</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="输入日程详细描述"
          rows={3}
          maxLength={500}
        />
        <div className="char-count">
          {formData.description?.length || 0} / 500
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-btn" disabled={submitting}>
          取消
        </button>
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? '添加中...' : '添加日程'}
        </button>
      </div>
    </form>
  );
}
