import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Team, TeamMember, WorkGroup, TeamInvitation } from '../types/database';
import { useToast } from '../hooks/useToast';
import { validateLength, validateEmail } from '../utils/validation';
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
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showManageGroup, setShowManageGroup] = useState<number | null>(null);
  const [groupFormData, setGroupFormData] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      const { data: memberData, error: memberError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);

      if (memberError) throw memberError;
      setMembers(memberData || []);

      const { data: groupData, error: groupError } = await supabase
        .from('work_groups')
        .select('*')
        .eq('team_id', teamId);

      if (groupError) throw groupError;
      setWorkGroups(groupData || []);

      // 加载待处理的邀请
      const { data: invitationData, error: invitationError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (!invitationError && invitationData) {
        setPendingInvitations(invitationData);
      }

    } catch (error) {
      console.error('加载团队数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : '加载失败，请重试';
      showError(errorMessage);
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

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

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证邮箱格式
    const emailValidation = validateEmail(inviteEmail.trim());
    if (!emailValidation.isValid) {
      showError(emailValidation.error || '邮箱格式不正确');
      return;
    }

    if (submitting) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('请先登录');
        return;
      }

      // 调用数据库函数创建邀请
      const { data: invitationData, error: invitationError } = await supabase
        .rpc('create_team_invitation', {
          p_team_id: parseInt(teamId!),
          p_email: inviteEmail.trim(),
          p_invited_by: user.id
        });

      if (invitationError) {
        // 处理特定错误
        const errorMsg = invitationError.message || '';
        const errorCode = invitationError && typeof invitationError === 'object' && 'code' in invitationError 
          ? String(invitationError.code) 
          : '';
        
        if (errorMsg.includes('已经是团队成员')) {
          showError('该用户已经是团队成员');
        } else if (errorMsg.includes('已有待处理的邀请')) {
          showError('该邮箱已有待处理的邀请');
        } else if (errorMsg.includes('stack depth limit exceeded') || errorCode === '54001') {
          showError('系统错误：请稍后重试。如果问题持续，请联系管理员。');
          console.error('栈溢出错误详情:', invitationError);
        } else {
          throw invitationError;
        }
        return;
      }

      if (!invitationData || invitationData.length === 0) {
        throw new Error('创建邀请失败：未返回数据');
      }

      const invitation = invitationData[0];
      if (!invitation || !invitation.token) {
        throw new Error('创建邀请失败：返回数据不完整');
      }
      const inviteUrl = `${window.location.origin}/invite/accept?token=${invitation.token}`;

      // 发送邀请邮件
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const { error: emailError } = await fetch(`${supabaseUrl}/functions/v1/send-invitation-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            email: inviteEmail.trim(),
            teamName: team?.name || '团队',
            inviteUrl: inviteUrl,
            inviterName: user.email || '团队成员',
          }),
        }).then(res => res.json());

        if (emailError) {
          console.warn('邮件发送失败，但邀请已创建:', emailError);
          // 即使邮件发送失败，也显示成功，因为邀请已创建
          showSuccess(`邀请已创建！邀请链接：${inviteUrl}`);
        } else {
          showSuccess('邀请邮件已发送！');
        }
      } catch (emailErr) {
        console.warn('邮件发送失败，但邀请已创建:', emailErr);
        // 即使邮件发送失败，也显示成功，因为邀请已创建
        showSuccess(`邀请已创建！邀请链接：${inviteUrl}`);
      }

      setInviteEmail('');
      setShowInviteForm(false);
      loadTeamData();
    } catch (error) {
      console.error('邀请成员失败:', error);
      const errorMessage = error instanceof Error ? error.message : '邀请失败，请重试';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      showSuccess('邀请已取消');
      loadTeamData();
    } catch (error) {
      console.error('取消邀请失败:', error);
      const errorMessage = error instanceof Error ? error.message : '取消邀请失败，请重试';
      showError(errorMessage);
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!team) return <div>未找到团队信息</div>;

  return (
    <div className="team-management-page fade-in">
      <div className="team-header-premium">
        <button onClick={() => navigate('/teams')} className="back-link">
          ← 返回团队列表
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
            <div className="section-header-premium">
              <h3>核心成员</h3>
              <button className="btn-primary-small" onClick={() => setShowInviteForm(!showInviteForm)}>
                {showInviteForm ? '取消邀请' : '+ 邀请成员'}
              </button>
            </div>

            {showInviteForm && (
              <form onSubmit={handleInviteMember} className="invite-form-premium card slide-in">
                <div className="form-group">
                  <label>邮箱地址</label>
                  <input 
                    type="email" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="input-field"
                    placeholder="输入成员的邮箱地址"
                  />
                  <p className="hint">提示：系统将向该邮箱发送邀请邮件，对方点击确认后即可加入团队</p>
                </div>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: '100%' }}
                  disabled={submitting}
                >
                  {submitting ? '发送中...' : '发送邀请'}
                </button>
              </form>
            )}

            {pendingInvitations.length > 0 && (
              <div className="pending-invitations-section" style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>待处理的邀请</h4>
                <div className="invitations-list">
                  {pendingInvitations.map(inv => (
                    <div key={inv.id} className="invitation-item card" style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{inv.email}</span>
                        <span style={{ fontSize: '0.85rem', color: '#999', marginLeft: '10px' }}>
                          过期时间: {new Date(inv.expires_at).toLocaleString()}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleCancelInvitation(inv.id)}
                        className="btn-secondary-small"
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        取消邀请
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
    </div>
  );
}

