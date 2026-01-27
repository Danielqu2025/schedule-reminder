import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TeamInvitation } from '../types/database';
import { useToast } from '../hooks/useToast';
import { validateEmail } from '../utils/validation';
import '../pages/TeamManagementPage.css'; // Import styles to ensure they are applied

interface TeamInvitationManagerProps {
  teamId: string;
  teamName: string;
  onInviteSuccess: () => void;
}

export default function TeamInvitationManager({ teamId, teamName, onInviteSuccess }: TeamInvitationManagerProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (teamId) {
      fetchPendingInvitations();
    }
  }, [teamId]);

  const fetchPendingInvitations = async () => {
    try {
      const { data: invitationData, error: invitationError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('team_id', teamId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (invitationError) throw invitationError;
      
      if (invitationData) {
        setPendingInvitations(invitationData);
      }
    } catch (error) {
      console.error('加载邀请列表失败:', error);
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
          p_team_id: parseInt(teamId),
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
            teamName: teamName || '团队',
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
      fetchPendingInvitations(); // Refresh local pending list
      onInviteSuccess(); // Notify parent to refresh member list (if needed)
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
      fetchPendingInvitations();
    } catch (error) {
      console.error('取消邀请失败:', error);
      const errorMessage = error instanceof Error ? error.message : '取消邀请失败，请重试';
      showError(errorMessage);
    }
  };

  return (
    <div className="team-invitation-manager">
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
    </div>
  );
}
