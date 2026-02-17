import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../hooks/useToast';
import { validatePassword } from '../utils/validation';
import './ChangePasswordPage.css';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showSuccess, showError, ToastContainer } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const newValidation = validatePassword(newPassword);
    if (!newValidation.isValid) {
      setError(newValidation.error || '新密码不符合要求');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }
    if (newPassword === currentPassword) {
      setError('新密码不能与当前密码相同');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email;
      if (!email) {
        setError('无法获取当前用户信息，请重新登录');
        setLoading(false);
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        setError('当前密码不正确');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
        data: { need_password_change: false },
      });

      if (updateError) throw updateError;

      showSuccess('密码已更新，请使用新密码登录');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '修改失败，请重试';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-page">
      <div className="change-password-card glass-card fade-in">
        <div className="change-password-header">
          <div className="change-password-logo">🔐</div>
          <h2>首次登录请修改密码</h2>
          <p>为保障账户安全，请设置您的新密码</p>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="current-password">当前密码</label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              minLength={6}
              className="input-field"
              placeholder="请输入当前密码"
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="new-password">新密码</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="input-field"
              placeholder="至少 6 位"
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">确认新密码</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="input-field"
              placeholder="再次输入新密码"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {loading ? '正在保存...' : '确认修改'}
          </button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}
