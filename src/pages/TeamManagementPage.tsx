import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { Team, TeamMember, WorkGroup } from '../types/database';
import { useToast } from '../hooks/useToast';
import { validateLength } from '../utils/validation';
import TeamInvitationManager from '../components/TeamInvitationManager';
import { TeamListSkeleton } from '../components/Skeletons';

import './TeamManagementPage.css';

export default function TeamManagementPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [workGroups, setWorkGroups] = useState<WorkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState<'members' | 'groups'>('members');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [showManageGroup, setShowManageGroup] = useState<number | null>(null);
  const [groupFormData, setGroupFormData] = useState({ name: '', description: '' });
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user ?? null));
  }, []);

  const loadTeamData = async () => {
    try {
      // Load team data
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', parseInt(teamId!))
        .single();

      if (teamError) throw teamError;

      if (teamData) {
        setTeam(teamData);
      }

      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamData?.id);

      if (membersError) throw membersError;

      if (membersData) {
        setMembers(membersData);
      }

      // Load work groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('work_groups')
        .select('*')
        .eq('team_id', teamData?.id);

      if (groupsError) throw groupsError;

      if (groupsData) {
        setWorkGroups(groupsData);
      }
    } catch (error) {
      console.error('加载团队数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : '加载失败，请重试';
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (loading) {

    return <TeamListSkeleton />;
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    const nameValidation = validateLength(groupFormData.name, 1, 255, '工作组名称');
    if (!nameValidation.isValid) {
      showError(nameValidation.error || '验证失败');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('work_groups')
        .insert({
          team_id: parseInt(teamId!),
          name: groupFormData.name,
          description: groupFormData.description,
        });

      if (error) throw error;

      setGroupFormData({ name: '', description: '' });
      setShowGroupForm(false);
      showSuccess('工作组创建成功！');
      loadTeamData();
    } catch (error) {
      console.error('创建工作组失败:', error);
      const errorMessage = error instanceof Error ? error.message : '创建失败，请重试';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManageGroup = async (groupId: number) => {
    try {
      const { data, error } = await supabase
        .from('work_group_members')
        .select('user_id')
        .eq('work_group_id', groupId);
      
      if (error) throw error;
      setGroupMembers(data.map(m => m.user_id));
      setShowManageGroup(groupId);
    } catch (error) {
      console.error('获取成员失败:', error);
      const errorMessage = error instanceof Error ? error.message : '获取成员失败，请重试';
      showError(errorMessage);
    }
  };

  const toggleGroupMember = async (userId: string) => {
    if (!showManageGroup) return;

    const isMember = groupMembers.includes(userId);
    try {
      if (isMember) {
        const { error } = await supabase
          .from('work_group_members')
          .delete()
          .eq('work_group_id', showManageGroup)
          .eq('user_id', userId);
        if (error) throw error;
        setGroupMembers(prev => prev.filter(id => id !== userId));
        showSuccess('成员已移除');
      } else {
        const { error } = await supabase
          .from('work_group_members')
          .insert({
            work_group_id: showManageGroup,
            user_id: userId
          });
        if (error) throw error;
        setGroupMembers(prev => [...prev, userId]);
        showSuccess('成员已添加');
      }
    } catch (error) {
      console.error('操作失败:', error);
      const errorMessage = error instanceof Error ? error.message : '操作失败，请重试';
      showError(errorMessage);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;

  if (!team) return <div>未找到团队信息</div>;

  return (
    <div className="team-management-page fade-in">
      <div className="team-header-premium">
        <button onClick={() => navigate('/teams')} className="back-link">
          ◀ 返回团队列表
        </button>
        <div className="team-title-row">
          <h1>{team.name}</h1>
          <div className="team-stats-mini">
            <span>👥 {members.length} 成员</span>
            <span>📦 {workGroups.length} 工作组</span>
          </div>
        </div>
        <p className="team-desc-premium">{team.description || '项目协作团队'}</p>
      </div>

      <div className="management-tabs-premium">
        <button 
          className={`tab-btn-premium ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          团队成员
        </button>
        <button 
          className={`tab-btn-premium ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          工作组架构
        </button>
      </div>

      <div className="tab-content-premium">
        {activeTab === 'members' ? (
          <div className="members-section-premium">
            <TeamInvitationManager
              teamId={teamId!}
              teamName={team.name}
              onInviteSuccess={loadTeamData}
              canImportCsv={Boolean(
                currentUser && members.some((m) => m.user_id === currentUser.id && (m.role === 'owner' || m.role === 'admin'))
              )}
            />

            <div className="members-grid-premium">

              {members.map(member => (
                <div key={member.id} className="member-card-premium card">
                  <div className="member-avatar-premium">{member.user_id.slice(0, 2).toUpperCase()}</div>
                  <div className="member-info-premium">
                    <h4>ID: {member.user_id.slice(0, 8)}...</h4>
                    <span className={`role-badge role-${member.role}`}>{member.role}</span>
                  </div>
                  <div className="member-joined">加入日期: {new Date(member.joined_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="groups-section-premium">
            <div className="section-header-premium">
              <h3>工作组</h3>
              <button onClick={() => setShowGroupForm(!showGroupForm)} className="btn-primary-small">
                {showGroupForm ? '取消创建' : '+ 新建工作组'}
              </button>
            </div>

            {showGroupForm && (
              <form onSubmit={handleCreateGroup} className="group-form-premium card slide-in">
                <div className="form-group">
                  <label>工作组名称 *</label>
                  <input 
                    type="text" 
                    value={groupFormData.name}
                    onChange={(e) => setGroupFormData({...groupFormData, name: e.target.value})}
                    required
                    className="input-field"
                    placeholder="例如：后端研发组"
                  />
                </div>
                <div className="form-group">
                  <label>职能描述</label>
                  <textarea 
                    value={groupFormData.description}
                    onChange={(e) => setGroupFormData({...groupFormData, description: e.target.value})}
                    className="input-field"
                    placeholder="描述该工作组的主要职责..."
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '100%' }}
                  disabled={submitting}
                >
                  {submitting ? '创建中...' : '立即创建'}
                </button>
              </form>
            )}

            <div className="groups-grid-premium">
              {workGroups.length === 0 ? (
                <p className="empty-msg">暂无工作组，开始创建一个吧！</p>
              ) : (
                workGroups.map(group => (
                  <div key={group.id} className="group-card-premium card">
                    <div className="group-card-header">
                      <h4>{group.name}</h4>
                      <button className="manage-btn" onClick={() => handleManageGroup(group.id)}>配置成员</button>
                    </div>
                    <p className="group-desc">{group.description || '暂无职能描述'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showManageGroup && (
        <div className="modal-overlay">
          <div className="modal-content glass-card fade-in">
            <div className="modal-header">
              <h3>管理工作组成员</h3>
              <button className="close-btn" onClick={() => setShowManageGroup(null)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-hint">选择要加入此工作组的团队成员：</p>
              <div className="member-selector-list">
                {members.map(m => (
                  <label key={m.id} className="selector-item">
                    <input 
                      type="checkbox" 
                      checked={groupMembers.includes(m.user_id)}
                      onChange={() => toggleGroupMember(m.user_id)}
                    />
                    <div className="selector-info">
                      <span className="selector-name">用户 {m.user_id.slice(0, 8)}</span>
                      <span className="selector-role">{m.role}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowManageGroup(null)}>完成配置</button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

