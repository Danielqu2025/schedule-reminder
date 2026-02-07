import { useState, useEffect, useCallback } from 'react';
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

// Simple UUID generator fallback
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function TeamInvitationManager({ teamId, teamName, onInviteSuccess }: TeamInvitationManagerProps) {

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<TeamInvitation[]>([]);
  const { showSuccess, showError, ToastContainer } = useToast();

  useEffect(() => {
    if (teamId) {
      fetchPendingInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const fetchPendingInvitations = useCallback(async () => {
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
  }, [teamId]);

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

      // 检查是否已有待处理的邀请
      const { data: existingInvites } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('team_id', teamId)
        .eq('email', inviteEmail.trim().toLowerCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (existingInvites && existingInvites.length > 0) {
        showError('该邮箱已有待处理的邀请');
        return;
      }

      const token = generateUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: invitation, error: invitationError } = await supabase

        .from('team_invitations')
        .insert({
          team_id: parseInt(teamId),
          email: inviteEmail.trim().toLowerCase(),
          invited_by: user.id,
          token,
          status: 'pending',
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (invitationError) {
        const errorMsg = invitationError.message || '';
        if (errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
          showError('该邮箱已有待处理的邀请');
        } else {
          throw invitationError;
        }
        return;
      }

      if (!invitation || !invitation.token) {
        throw new Error('创建邀请失败：返回数据不完整');
      }
      const inviteUrl = `${window.location.origin}/invite/accept?token=${invitation.token}`;

      // 先给用户即时反馈，避免“点了没反应”的感觉
      showSuccess('邀请已创建，正在发送邮件…');

      // 带超时的 Edge Function 调用（请求挂起时 12 秒后当作失败，仍提示邀请已创建）
      const INVITE_EMAIL_TIMEOUT_MS = 12000;
      const invokePromise = supabase.functions.invoke('send-invitation-email', {
        body: {
          email: inviteEmail.trim(),
          teamName: teamName || '团队',
          inviteUrl,
          inviterName: user.email || '团队成员',
        },
      });
      const timeoutPromise = new Promise<{ error: Error }>((resolve) =>
        setTimeout(() => resolve({ error: new Error('timeout') }), INVITE_EMAIL_TIMEOUT_MS)
      );
      const { error: emailError } = await Promise.race([invokePromise, timeoutPromise]);

      if (emailError) {
        console.warn('邮件发送失败或超时，但邀请已创建:', emailError);
        showSuccess('邀请已创建！请将邀请链接复制发送给受邀人（链接已生成）');
      } else {
        showSuccess('邀请邮件已发送！');
      }

      setInviteEmail('');
      setShowInviteForm(false);
      fetchPendingInvitations();
      onInviteSuccess();
    } catch (error) {
      console.error('邀请成员失败:', error);
      const err = error as { message?: string; code?: string };
      const msg = err?.message || (err?.code ? `错误码: ${err.code}` : '') || '邀请失败，请重试';
      showError(msg.length > 80 ? '邀请失败，请检查权限或稍后重试' : msg);
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
            <label htmlFor="invite-email">邮箱地址</label>
            <input 
              id="invite-email"
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
      <ToastContainer />
    </div>
  );
}
