/**
 * 任务创建表单组件 - 包含依赖关系、多人分配、预估工时
 */

import React, { useState, useEffect } from 'react';
import { Users, Link2, X, Check } from 'lucide-react';
import { Task, Team, WorkGroup, User } from '../types/database';

interface TaskFormProps {
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  teams: Team[];
  workGroups: WorkGroup[];
  teamMembers: { [key: string]: User[] };
}

interface CreateTaskFormData {
  title: string;
  description?: string;
  team_id: string;
  work_group_id?: string;
  priority: 'low' | 'medium' | 'high';
  start_date?: string;
  end_date?: string;
  estimated_hours?: number;
  assignees: string[];
  dependencies: number[];  // 前置任务ID列表
  tags?: string[];
  attachments?: File[];
}

export default function TaskForm({ onSubmit, onCancel, submitting, teams, workGroups, teamMembers }: TaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskFormData>({
    title: '',
    description: '',
    team_id: '',
    work_group_id: '',
    priority: 'medium',
    start_date: '',
    end_date: '',
    estimated_hours: undefined,
    assignees: [],
    dependencies: [],
    tags: [],
    attachments: [],
  });

  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [depInput, setDepInput] = useState('');
  const [suggestedDeps, setSuggestedDeps] = useState<Task[]>([]);

  // 过选团队成员
  useEffect(() => {
    if (selectedTeamId && teamMembers[selectedTeamId]) {
      setFilteredMembers(teamMembers[selectedTeamId]);
    } else {
      setFilteredMembers([]);
    }
    }, [selectedTeamId, teamMembers]);

  // 模拟任务建议（实际应该从API获取）
  useEffect(() => {
    if (selectedTeamId && depInput) {
      // 实际应该从API获取当前团队的任务列表
      setSuggestedDeps([]); // 暂时为空
    }
  }, [selectedTeamId, depInput]);

  const priorityOptions = [
    { value: 'high', label: '高', color: '#ef4444' },
    { value: 'medium', label: '中', color: '#f59e0b' },
    { value: 'low', label: '低', color: '#10b981' },
  ];

  const commonTags = ['前端', '后端', '测试', '设计', '文档', '部署'];

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

  const addDependency = (taskId: number) => {
    const task = suggestedDeps.find(t => t.id === taskId);
    if (task && !formData.dependencies.includes(taskId)) {
      setFormData({ ...formData, dependencies: [...formData.dependencies, taskId] });
      setDepInput('');
      setSuggestedDeps([]);
    }
  };

  const removeDependency = (taskId: number) => {
    setFormData({ ...formData, dependencies: formData.dependencies.filter(id => id !== taskId) });
  };

  const addAssignee = (userId: string) => {
    if (userId && !formData.assignees.includes(userId)) {
      setFormData({ ...formData, assignees: [...formData.assignees, userId] });
    }
  };

  const removeAssignee = (userId: string) => {
    setFormData({ ...formData, assignees: formData.assignees.filter(id => id !== userId) });
  };

  return (
    <form onSubmit={handleSubmit} className="task-form-enhanced">
      {/* 标题 */}
      <div className="form-group">
        <label>任务标题 *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="输入任务标题"
          required
          maxLength={100}
        />
      </div>

      {/* 优先级 */}
      <div className="form-group">
        <label>优先级</label>
        <div className="priority-options">
          {priorityOptions.map(option => (
            <button
              key={option.value}
              type="button"
              className={`priority-option ${formData.priority === option.value ? 'active' : ''}`}
              style={{ '--priority-color': option.color }}
              onClick={() => setFormData({ ...formData, priority: option.value as 'low' | 'medium' | 'high' })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 团队选择 */}
      <div className="form-row">
        <div className="form-group">
          <label>所属团队 *</label>
          <select
            value={formData.team_id}
            onChange={(e) => {
              setFormData({ ...formData, team_id: e.target.value, work_group_id: '' });
              setSelectedTeamId(e.target.value);
            }}
            required
          >
            <option value="">选择团队</option>
            {teams.map(team => (
              <option key={team.id} value={team.id.toString()}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        {selectedTeamId && (
          <div className="form-group">
            <label>工作组（可选）</label>
            <select
              value={formData.work_group_id}
              onChange={(e) => setFormData({ ...formData, work_group_id: e.target.value })}
            >
              <option value="">选择工作组</option>
              {workGroups
                .filter(wg => wg.team_id === parseInt(selectedTeamId))
                .map(wg => (
                  <option key={wg.id} value={wg.id.toString()}>
                    {wg.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      {/* 分配人员 */}
      <div className="form-group">
        <label>分配给 *</label>
        <div className="assignees-section">
          <div className="assignee-input">
            <Users size={16} />
            <input
              type="text"
              value={formData.assignees.join(', ')}
              onChange={(e) => setFormData({ ...formData, assignees: e.target.value.split(',').map(id => id.trim()) })}
              placeholder="输入用户ID，用逗号分隔"
              required
            />
          </div>
          {filteredMembers.length > 0 && (
            <div className="member-suggestions">
              <div className="suggestions-title">团队成员：</div>
              <div className="suggestions-list">
                {filteredMembers.map(member => (
                  <button
                    key={member.id}
                    type="button"
                    className={`member-chip ${formData.assignees.includes(member.id) ? 'selected' : ''}`}
                    onClick={() => addAssignee(member.id)}
                  >
                    {member.email || member.id}
                    {formData.assignees.includes(member.id) && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="selected-members">
            {formData.assignees.map(userId => {
              const member = filteredMembers.find(m => m.id === userId);
              return (
                <span key={userId} className="member-tag">
                  {member?.email || userId}
                  <button
                    type="button"
                    onClick={() => removeAssignee(userId)}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 依赖关系 */}
      <div className="form-group">
        <label>前置任务（可选）</label>
        <div className="dependencies-section">
          <div className="dep-input-wrapper">
            <Link2 size={16} className="dep-icon" />
            <input
              type="text"
              value={depInput}
              onChange={(e) => setDepInput(e.target.value)}
              placeholder="输入任务ID或搜索..."
            />
          </div>
          {suggestedDeps.length > 0 && (
            <div className="dep-suggestions">
              <div className="suggestions-title">可选任务：</div>
              <div className="suggestions-list">
                {suggestedDeps.map(task => (
                  <button
                    key={task.id}
                    type="button"
                    className={`dep-option ${formData.dependencies.includes(task.id) ? 'selected' : ''}`}
                    onClick={() => addDependency(task.id)}
                  >
                    <div className="dep-title">{task.title}</div>
                    <div className="dep-meta">
                      <span className={`dep-status status-${task.status}`}>
                        {task.status === 'completed' ? '已完成' : '进行中'}
                      </span>
                      <span className="dep-date">{task.end_date}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="selected-deps">
            {formData.dependencies.map(depId => {
              const task = suggestedDeps.find(t => t.id === depId);
              return (
                <span key={depId} className="dep-tag">
                  {task?.title || `任务 #${depId}`}
                  <button
                    type="button"
                    onClick={() => removeDependency(depId)}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 标签 */}
      <div className="form-group">
        <label>标签（可选）</label>
        <div className="tags-input-wrapper">
          <div className="selected-tags">
            {formData.tags.map(tag => (
              <span key={tag} className="tag-chip">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
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
          {tagInput && commonTags.filter(t => t.includes(tagInput)).length > 0 && (
            <div className="tag-suggestions">
              {commonTags
                .filter(tag => tag.includes(tagInput) && !formData.tags.includes(tag))
                .slice(0, 3)
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
          )}
        </div>
      </div>

      {/* 预估工时 */}
      <div className="form-row">
        <div className="form-group">
          <label>预估工时（小时）</label>
          <input
            type="number"
            value={formData.estimated_hours || ''}
            onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="如: 8.5"
            min={0}
            max={1000}
            step={0.5}
          />
        </div>
        <div className="form-group">
          <label>截止日期</label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            min={formData.start_date}
          />
        </div>
      </div>

      {/* 描述 */}
      <div className="form-group">
        <label>任务描述</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="输入任务详细描述..."
          rows={4}
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
          {submitting ? '创建中...' : '创建任务'}
        </button>
      </div>
    </form>
  );
}
