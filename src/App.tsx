import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, Component, ReactNode } from 'react';
import { supabase } from './lib/supabaseClient';
import { User } from '@supabase/supabase-js';

// 页面组件
import LoginPage from './pages/LoginPage';
import PersonalSchedulePage from './pages/PersonalSchedulePage';
import TeamOverviewPage from './pages/TeamOverviewPage';
import TeamManagementPage from './pages/TeamManagementPage';
import TaskManagementPage from './pages/TaskManagementPage';
import WorkItemPage from './pages/WorkItemPage';
import StatisticsPage from './pages/StatisticsPage';
import InviteAcceptPage from './pages/InviteAcceptPage';

// 布局组件
import Layout from './components/Layout/Layout';
import { useReminderEngine } from './hooks/useReminderEngine';

// Error Boundary 组件
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误到控制台（生产环境可以发送到错误追踪服务）
    console.error('应用错误:', error);
    console.error('错误信息:', errorInfo);
    
    // 生产环境可以发送到错误追踪服务
    // if (import.meta.env.PROD) {
    //   // 发送到 Sentry 或其他错误追踪服务
    // }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'var(--bg-main)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ marginBottom: '12px', color: 'var(--text-dark)' }}>出错了</h2>
          <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
            很抱歉，应用程序发生了预期外的错误。
          </p>
          {this.state.error && import.meta.env.DEV && (
            <details style={{ 
              marginBottom: '24px', 
              textAlign: 'left',
              maxWidth: '600px',
              padding: '16px',
              background: 'var(--card-bg)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>错误详情（开发模式）</summary>
              <pre style={{ 
                overflow: 'auto',
                color: 'var(--danger)',
                fontSize: '11px'
              }}>
                {this.state.error.toString()}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button 
            className="btn-primary" 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{ padding: '12px 24px' }}
          >
            刷新页面
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 启动全局提醒引擎
  useReminderEngine(user?.id);


  useEffect(() => {
    // 检查当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--bg-main)',
        gap: '20px'
      }}>
        <div className="loading-spinner" style={{ 
          width: '50px', 
          height: '50px', 
          border: '4px solid var(--primary-glow)', 
          borderTopColor: 'var(--primary)', 
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>ProjectFlow 正在启动...</div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <LoginPage />} 
        />
        <Route
          path="/invite/accept"
          element={<InviteAcceptPage />}
        />
        <Route
          path="/"
          element={user ? <Layout user={user} /> : <Navigate to="/login" replace />}
        >
          <Route index element={<PersonalSchedulePage />} />
          <Route path="teams" element={<TeamOverviewPage />} />
          <Route path="teams/:teamId" element={<TeamManagementPage />} />
          <Route path="tasks" element={<TaskManagementPage />} />
          <Route path="work-items" element={<WorkItemPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

