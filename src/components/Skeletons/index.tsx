/**
 * 骨架屏组件 - 用于加载状态优化
 */

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', children }) => {
  return (
    <div className={`skeleton ${className}`} style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
      {children}
    </div>
  );
};

// ========== 页面骨架屏 ==========

export const ScheduleListSkeleton: React.FC = () => {
  return (
    <div className="schedules-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="schedule-card skeleton">
          <div className="schedule-header">
            <Skeleton className="skeleton-title" style={{ width: '60%', height: '24px' }} />
            <Skeleton className="skeleton-badge" style={{ width: '80px', height: '24px' }} />
          </div>
          <div className="schedule-info">
            <Skeleton style={{ width: '70%', height: '16px' }} />
            <Skeleton style={{ width: '50%', height: '16px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TaskListSkeleton: React.FC = () => {
  return (
    <div className="tasks-grid">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="task-card skeleton">
          <div className="task-header">
            <Skeleton className="skeleton-title" style={{ width: '70%', height: '20px' }} />
            <Skeleton className="skeleton-badge" style={{ width: '60px', height: '20px' }} />
          </div>
          <div className="task-body">
            <Skeleton style={{ width: '100%', height: '14px' }} />
            <Skeleton style={{ width: '90%', height: '14px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const TeamListSkeleton: React.FC = () => {
  return (
    <div className="teams-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="team-card skeleton">
          <Skeleton className="skeleton-icon" style={{ width: '48px', height: '48px' }} />
          <div className="team-info">
            <Skeleton className="skeleton-title" style={{ width: '50%', height: '20px' }} />
            <Skeleton style={{ width: '70%', height: '14px' }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const MemberListSkeleton: React.FC = () => {
  return (
    <div className="members-list">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="member-item skeleton">
          <Skeleton className="skeleton-avatar" style={{ width: '40px', height: '40px' }} />
          <Skeleton className="skeleton-name" style={{ width: '70%', height: '16px' }} />
          <Skeleton style={{ width: '50%', height: '12px' }} />
        </div>
      ))}
    </div>
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="stat-card skeleton">
      <Skeleton style={{ width: '30%', height: '32px' }} />
      <Skeleton style={{ width: '50%', height: '48px' }} />
    </div>
  );
};

// ========== 布局骨架屏 ==========

export const PageSkeleton: React.FC = () => {
  return (
    <div className="page-skeleton">
      <div className="skeleton-header">
        <Skeleton className="skeleton-title" style={{ width: '30%', height: '32px' }} />
        <Skeleton className="skeleton-button" style={{ width: '100px', height: '32px' }} />
      </div>
      <div className="skeleton-content">
        <Skeleton style={{ width: '100%', height: '400px' }} />
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="dashboard-skeleton">
      <div className="skeleton-header">
        <Skeleton className="skeleton-title" style={{ width: '25%', height: '32px' }} />
      </div>
      <div className="skeleton-stats">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="skeleton-charts">
        <Skeleton style={{ width: '100%', height: '300px' }} />
        <Skeleton style={{ width: '100%', height: '300px' }} />
      </div>
    </div>
  );
};

// ========== 表单骨架屏 ==========

export const FormSkeleton: React.FC = () => {
  return (
    <div className="form-skeleton">
      <Skeleton style={{ width: '100%', height: '24px', marginBottom: '16px' }} />
      <Skeleton style={{ width: '100%', height: '48px', marginBottom: '16px' }} />
      <Skeleton style={{ width: '100%', height: '48px', marginBottom: '16px' }} />
      <Skeleton style={{ width: '100%', height: '100px', marginBottom: '24px' }} />
      <Skeleton style={{ width: '100%', height: '48px' }} />
    </div>
  );
};

// ========== 卡片骨架屏 ==========

export const CardSkeleton: React.FC = () => {
  return (
    <div className="card skeleton">
      <Skeleton style={{ width: '100%', height: '16px', marginBottom: '12px' }} />
      <Skeleton style={{ width: '80%', height: '16px', marginBottom: '8px' }} />
      <Skeleton style={{ width: '60%', height: '16px' }} />
    </div>
  );
};

// ========== 列表骨架屏 ==========

export const ListItemSkeleton: React.FC = () => {
  return (
    <div className="list-item skeleton">
      <Skeleton className="skeleton-avatar" style={{ width: '40px', height: '40px' }} />
      <div className="list-item-content">
        <Skeleton style={{ width: '60%', height: '16px', marginBottom: '4px' }} />
        <Skeleton style={{ width: '40%', height: '14px' }} />
      </div>
    </div>
  );
};

// ========== 加载指示器 ==========

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <div className="loading-text">加载中...</div>
    </div>
  );
};

// ========== 数据行骨架屏 ==========

export const DataRowSkeleton: React.FC = () => {
  return (
    <tr>
      <td><Skeleton style={{ width: '40%' }} /></td>
      <td><Skeleton style={{ width: '30%' }} /></td>
      <td><Skeleton style={{ width: '20%' }} /></td>
      <td><Skeleton style={{ width: '10%' }} /></td>
    </tr>
  );
};

// ========== 输入框骨架屏 ==========

export const InputSkeleton: React.FC = () => {
  return (
    <div className="input-skeleton">
      <Skeleton style={{ width: '100%', height: '48px' }} />
    </div>
  );
};
