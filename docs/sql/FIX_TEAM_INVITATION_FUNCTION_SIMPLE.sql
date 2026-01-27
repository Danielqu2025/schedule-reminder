-- ==========================================
-- 修复 create_team_invitation 函数 - 最终版本
-- ==========================================
-- 
-- 问题：stack depth limit exceeded（栈溢出）
-- 原因：SECURITY DEFINER 函数中查询 team_members 表时仍然受到 RLS 影响，
--       导致递归查询 teams 表，形成栈溢出
-- 
-- 解决方案：简化函数逻辑
-- 1. 移除团队成员检查（移到 accept_team_invitation 函数中）
-- 2. 只检查待处理的邀请（避免复杂查询）
-- 3. 使用 set_config 禁用 RLS，避免递归
-- 4. 团队成员检查在 accept_team_invitation 中进行，避免重复加入
-- ==========================================

-- 删除旧函数
DROP FUNCTION IF EXISTS create_team_invitation(BIGINT, VARCHAR, UUID);

-- 重新创建函数（简化版本，避免递归）
CREATE OR REPLACE FUNCTION create_team_invitation(
  p_team_id BIGINT,
  p_email VARCHAR(255),
  p_invited_by UUID
)
RETURNS TABLE (
  id BIGINT,
  token VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_token VARCHAR(255);
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_invitation_id BIGINT;
BEGIN
  -- 禁用 RLS 以避免递归
  PERFORM set_config('row_security', 'off', true);

  -- 检查是否已有待处理的邀请（只检查这一项，避免复杂查询）
  IF EXISTS (
    SELECT 1 FROM team_invitations 
    WHERE team_invitations.team_id = p_team_id 
    AND team_invitations.email = p_email 
    AND team_invitations.status = 'pending'
    AND team_invitations.expires_at > NOW()
  ) THEN
    RAISE EXCEPTION '该邮箱已有待处理的邀请';
  END IF;

  -- 生成令牌和过期时间（7天后）
  v_token := generate_invitation_token();
  v_expires_at := NOW() + INTERVAL '7 days';

  -- 插入邀请记录
  -- 注意：团队成员检查移到 accept_team_invitation 函数中
  INSERT INTO team_invitations (team_id, email, invited_by, token, expires_at)
  VALUES (p_team_id, p_email, p_invited_by, v_token, v_expires_at)
  RETURNING team_invitations.id, team_invitations.token, team_invitations.expires_at
  INTO v_invitation_id, v_token, v_expires_at;

  -- 返回结果
  id := v_invitation_id;
  token := v_token;
  expires_at := v_expires_at;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
