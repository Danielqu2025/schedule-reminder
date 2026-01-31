import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Hexagon, 
  CalendarClock, 
  Layers, 
  ListChecks, 
  Network, 
  BarChart3, 
  LogOut, 
  Bell,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

import { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import { useToast } from '../../hooks/useToast';
import './Layout.css';

interface LayoutProps {
  user: User;
}

export default function Layout({ user }: LayoutProps) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { showSuccess, ToastContainer } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const copyUUID = async () => {
    if (user.id) {
      try {
        await navigator.clipboard.writeText(user.id);
        showSuccess('用户 ID 已复制到剪贴板');
      } catch (error) {
        // 降级方案：使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = user.id;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess('用户 ID 已复制到剪贴板');
      }
    }
  };

  return (
    <div className={`layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="layout-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">
            <Hexagon size={20} strokeWidth={2.5} />
          </div>
          <h1 className="brand-name">ProjectFlow</h1>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-group">
            <span className="nav-label">个人</span>
            <NavLink to="/" end className="nav-item">
              <span className="nav-icon">
                <CalendarClock size={20} strokeWidth={2} />
              </span>
              <span className="nav-text">个人日程</span>
            </NavLink>
          </div>

          <div className="nav-group">
            <span className="nav-label">团队协作</span>
            <NavLink to="/teams" className="nav-item">
              <span className="nav-icon">
                <Layers size={20} strokeWidth={2} />
              </span>
              <span className="nav-text">团队概览</span>
            </NavLink>
            <NavLink to="/tasks" className="nav-item">
              <span className="nav-icon">
                <ListChecks size={20} strokeWidth={2} />
              </span>
              <span className="nav-text">任务管理</span>
            </NavLink>
            <NavLink to="/work-items" className="nav-item">
              <span className="nav-icon">
                <Network size={20} strokeWidth={2} />
              </span>
              <span className="nav-text">工作分解</span>
            </NavLink>
          </div>

          <div className="nav-group">
            <span className="nav-label">分析</span>
            <NavLink to="/statistics" className="nav-item">
              <span className="nav-icon">
                <BarChart3 size={20} strokeWidth={2} />
              </span>
              <span className="nav-text">统计报告</span>
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar" title="点击复制您的 ID" onClick={copyUUID} style={{ cursor: 'pointer' }}>
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-email-text" title={user.id}>{user.email}</div>
              <div className="user-status" onClick={copyUUID} style={{ cursor: 'pointer', fontSize: '0.7rem' }}>复制我的 ID</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="sign-out-link">
            <LogOut size={16} strokeWidth={2} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="layout-main">
        <header className="main-header">
          <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <div className="header-breadcrumbs">
            <span>首页</span> / <span className="current-page">当前页面</span>
          </div>
          <div className="header-notifications">
            <button className="icon-btn">
              <Bell size={18} />
            </button>
          </div>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}

