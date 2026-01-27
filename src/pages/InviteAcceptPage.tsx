import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../hooks/useToast';
import './InviteAcceptPage.css';

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const { showSuccess, showError, ToastContainer } = useToast();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<{
    teamName: string;
    email: string;
    inviterName: string;
  } | null>(null);

  useEffect(() => {
    // 检查是否有保存的邀请令牌（从登录页面跳转过来）
    const savedToken = localStorage.getItem('pending_invitation_token');
    const finalToken = token || savedToken;
    
    if (!finalToken) {
      showError('缺少邀请令牌');
      setLoading(false);
      return;
    }

    // 验证邀请令牌并获取邀请信息
    loadInvitationInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadInvitationInfo = async () => {
    try {
      // 获取最终使用的令牌
      const savedToken = localStorage.getItem('pending_invitation_token');
      const finalToken = token || savedToken;
      
      if (!finalToken) {
        throw new Error('缺少邀请令牌');
      }

      // 从邀请表中获取邀请信息
      const { data: invitationData, error: invitationError } = await supabase
        .from('team_invitations')
        .select(`
          *,
          teams:team_id (
            name
          )
        `)
        .eq('token', finalToken)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (invitationError || !invitationData) {
        throw new Error('邀请不存在或已过期');
      }

      // 注意：无法直接获取邀请者邮箱（需要服务端权限），使用团队名称代替
      const teamsData = invitationData.teams as { name?: string } | null;
      setInvitationInfo({
        teamName: teamsData?.name || '团队',
        email: invitationData.email,
        inviterName: '团队成员', // 简化处理，不显示具体邀请者
      });

      setLoading(false);
    } catch (error) {
      console.error('加载邀请信息失败:', error);
      const errorMessage = error instanceof Error ? error.message : '邀请不存在或已过期';
      showError(errorMessage);
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    // 获取最终使用的令牌
    const savedToken = localStorage.getItem('pending_invitation_token');
    const finalToken = token || savedToken;
    
    if (!finalToken) {
      showError('缺少邀请令牌');
      return;
    }

    setProcessing(true);

    try {
      // 检查用户是否已登录
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        // 用户未登录，跳转到登录页面，并保存邀请令牌
        localStorage.setItem('pending_invitation_token', finalToken);
        navigate('/login?redirect=/invite/accept');
        return;
      }

      // 验证用户邮箱是否匹配
      if (user.email !== invitationInfo?.email) {
        showError(`此邀请是发送给 ${invitationInfo?.email} 的，当前登录邮箱为 ${user.email}，请使用正确的邮箱登录`);
        return;
      }

      // 调用数据库函数接受邀请
      const { data: acceptData, error: acceptError } = await supabase
        .rpc('accept_team_invitation', {
          p_token: finalToken,
          p_user_id: user.id
        });

      if (acceptError) {
        throw acceptError;
      }

      if (!acceptData || acceptData.length === 0) {
        throw new Error('接受邀请失败：未返回数据');
      }

      const result = acceptData[0];
      if (!result.success) {
        throw new Error('接受邀请失败：操作未成功');
      }

      if (!result.team_id) {
        throw new Error('接受邀请失败：缺少团队 ID');
      }

      showSuccess('成功加入团队！');
      
      // 清除保存的邀请令牌
      localStorage.removeItem('pending_invitation_token');
      
      // 延迟跳转到团队页面
      setTimeout(() => {
        navigate(`/teams/${result.team_id}`);
      }, 1500);
    } catch (error) {
      console.error('接受邀请失败:', error);
      const errorMessage = error instanceof Error ? error.message : '接受邀请失败，请重试';
      showError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="invite-accept-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载邀请信息中...</p>
        </div>
        <ToastContainer />
      </div>
    );
  }

  if (!invitationInfo) {
    return (
      <div className="invite-accept-page">
        <div className="error-container">
          <h2>邀请无效</h2>
          <p>此邀请链接已过期或无效。</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>
            返回登录
          </button>
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="invite-accept-page">
      <div className="invite-accept-container">
        <div className="invite-header">
          <h1>🎉 团队邀请</h1>
        </div>
        <div className="invite-content">
          <p className="invite-message">
            <strong>{invitationInfo.inviterName}</strong> 邀请您加入团队
          </p>
          <div className="team-info-card">
            <h2>{invitationInfo.teamName}</h2>
            <p>加入后，您将能够与团队成员协作，共同管理任务和项目。</p>
          </div>
          <button
            className="btn-primary btn-large"
            onClick={handleAcceptInvitation}
            disabled={processing}
          >
            {processing ? '处理中...' : '接受邀请'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/login')}
            style={{ marginTop: '10px' }}
          >
            稍后处理
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
