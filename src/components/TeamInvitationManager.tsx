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
  /** 是否允许通过 CSV 批量导入账户（仅管理员/负责人） */
  canImportCsv?: boolean;
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

/** 解析 CSV 文本为 { email, password }[]，支持表头 email,password 或直接每行 email,password */
function parseCsvToUsers(csvText: string): { email: string; password: string }[] {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  const rows: { email: string; password: string }[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
    if (parts.length < 2) continue;
    const email = (parts[0] ?? '').toLowerCase();
    const password = parts[1] ?? '';
    if (i === 0 && email === 'email' && (password === 'password' || password === '密码')) continue;
    if (email && emailRegex.test(email) && password.length >= 6) {
      rows.push({ email, password });
    }
  }
  return rows;
}

export default function TeamInvitationManager({ teamId, teamName, onInviteSuccess, canImportCsv = false }: TeamInvitationManagerProps) {

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState<{ created: number; skipped: number; errors: { email: string; reason: string }[] } | null>(null);
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

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canImportCsv) return;
    setCsvImportResult(null);
    setSubmitting(true);
    try {
      const text = await file.text();
      const users = parseCsvToUsers(text);
      if (users.length === 0) {
        showError('CSV 中未找到有效行（需至少两列：邮箱、密码；密码至少 6 位）');
        setSubmitting(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('import-users-csv', {
        body: { teamId: parseInt(teamId, 10), users },
      });
      if (error) throw error;
      const payload = data as { success?: boolean; created?: number; skipped?: number; errors?: { email: string; reason: string }[] };
      setCsvImportResult({
        created: payload?.created ?? 0,
        skipped: payload?.skipped ?? 0,
        errors: payload?.errors ?? [],
      });
      const created = payload?.created ?? 0;
      if (created > 0) {
        showSuccess(`已导入 ${created} 个账户，用户首次登录需修改密码`);
        onInviteSuccess();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导入失败，请重试';
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="team-invitation-manager">
      <div className="section-header-premium">
        <h3>核心成员</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {canImportCsv && (
            <label className="btn-secondary-small" style={{ marginBottom: 0, cursor: 'pointer' }}>
              📄 CSV 导入账户
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvFileChange}
                disabled={submitting}
                style={{ display: 'none' }}
              />
            </label>
          )}
          <button className="btn-primary-small" onClick={() => setShowInviteForm(!showInviteForm)}>
            {showInviteForm ? '取消邀请' : '+ 邀请成员'}
          </button>
        </div>
      </div>

      {canImportCsv && (
        <div className="csv-import-hint card" style={{ marginBottom: '16px', padding: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <strong>CSV 导入说明：</strong> 仅管理员/负责人可见。CSV 需包含两列：<code>email</code>、<code>password</code>（密码至少 6 位）。
          导入后账户直接加入本团队，用户首次登录需修改密码。
        </div>
      )}

      {csvImportResult && (
        <div className="csv-import-result card" style={{ marginBottom: '16px', padding: '12px' }}>
          <div>✅ 新建 {csvImportResult.created} 个</div>
          {csvImportResult.skipped > 0 && <div>⏭ 跳过（已存在）{csvImportResult.skipped} 个</div>}
          {csvImportResult.errors.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <strong>错误：</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: '20px', fontSize: '0.85rem' }}>
                {csvImportResult.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e.email}: {e.reason}</li>
                ))}
                {csvImportResult.errors.length > 10 && <li>…共 {csvImportResult.errors.length} 条</li>}
              </ul>
            </div>
          )}
        </div>
      )}

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
