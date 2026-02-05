import React, { useState, useEffect } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../hooks/useToast';
import { validateEmail, validatePassword } from '../utils/validation';
import './LoginPage.css';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect');

  const { showSuccess, showError, ToastContainer } = useToast();

  useEffect(() => {
    // 检查是否有待处理的邀请令牌
    const pendingToken = localStorage.getItem('pending_invitation_token');
    if (pendingToken && redirectPath) {
      // 如果登录后需要处理邀请，显示提示
      console.log('检测到待处理的邀请');
    }
  }, [redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || '验证失败');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || '验证失败');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        showSuccess('注册成功！请检查邮箱验证链接（如果已启用邮箱验证）');
        // 清空表单
        setEmail('');
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        showSuccess('登录成功！');
        
        // 检查是否有待处理的邀请
        const pendingToken = localStorage.getItem('pending_invitation_token');
        if (pendingToken && redirectPath) {
          // 清除令牌并跳转到邀请确认页面
          localStorage.removeItem('pending_invitation_token');
          navigate(redirectPath);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作失败';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="visual-content">
          <h1>ProjectFlow</h1>
          <p>高效、简洁、实时的团队协作平台</p>
          <div className="visual-features">
            <div className="feature-item">⚡ 实时同步</div>
            <div className="feature-item">📊 数据分析</div>
            <div className="feature-item">🏢 团队管理</div>
          </div>
        </div>
      </div>
      <div className="login-content">
        <div className="login-container glass-card fade-in">
          <div className="login-header">
            <div className="login-logo">📅</div>
            <h2>{isSignUp ? '加入 ProjectFlow' : '欢迎回来'}</h2>
            <p>{isSignUp ? '开始高效管理您的团队任务' : '使用您的账户继续协作'}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">邮箱地址</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">登录密码</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? '正在处理...' : isSignUp ? '立即注册' : '登录系统'}
            </button>

            <div className="form-footer">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="toggle-btn"
              >
                {isSignUp ? '已经有账户？点击登录' : '还没有账户？免费注册'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );

}
