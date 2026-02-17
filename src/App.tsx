import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, Component, ReactNode, lazy, Suspense } from 'react';
import { supabase } from './lib/supabaseClient';
import { User } from '@supabase/supabase-js';

// 页面组件 - 使用lazy loading实现代码分割
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PersonalSchedulePage = lazy(() => import('./pages/PersonalSchedulePage'));
const TeamOverviewPage = lazy(() => import('./pages/TeamOverviewPage'));
const TeamManagementPage = lazy(() => import('./pages/TeamManagementPage'));
const TaskManagementPage = lazy(() => import('./pages/TaskManagementPage'));
const WorkItemPage = lazy(() => import('./pages/WorkItemPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const InviteAcceptPage = lazy(() => import('./pages/InviteAcceptPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));

// 布局组件
import Layout from './components/Layout/Layout';
import { useReminderEngine } from './hooks/useReminderEngine';

// 骨架屏组件用于lazy loading的fallback
import { PageSkeleton } from './components/Skeletons';

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
        background: 'var(--bg-deep)',
        gap: '20px',
        position: 'relative'
      }}>
        <div className="stars"></div>
        <div className="nebula"></div>
        <div className="loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255, 77, 77, 0.2)',
          borderTopColor: 'var(--coral-bright)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          position: 'relative',
          zIndex: 1
        }}></div>
        <div style={{ color: 'var(--text-primary)', fontWeight: 600, position: 'relative', zIndex: 1 }}>ProjectFlow 正在启动...</div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="stars"></div>
      <div className="nebula"></div>
      <Suspense fallback={<PageSkeleton />}>
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
            path="/change-password"
            element={user ? <ChangePasswordPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/"
            element={
              user
                ? (user.user_metadata?.need_password_change === true ? (
                    <Navigate to="/change-password" replace />
                  ) : (
                    <Layout user={user} />
                  ))
                : <Navigate to="/login" replace />
            }
          >
            <Route index element={<PersonalSchedulePage />} />
            <Route path="teams" element={<TeamOverviewPage />} />
            <Route path="teams/:teamId" element={<TeamManagementPage />} />
            <Route path="tasks" element={<TaskManagementPage />} />
            <Route path="work-items" element={<WorkItemPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;

