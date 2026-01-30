# 项目开发与配置指南

本指南整合了项目环境搭建、团队管理配置及常见问题的处理方案。

## 🛠️ 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase 账户

## 🚀 快速开始

### 1. 依赖安装
```bash
npm install
```

### 2. 环境变量配置
创建 `.env` 文件并填入 Supabase 信息：
```env
VITE_SUPABASE_URL=你的URL
VITE_SUPABASE_ANON_KEY=你的AnonKey
```

### 3. 数据库初始化
请参考 [`docs/sql/SQL_FILES_SUMMARY.md`](./sql/SQL_FILES_SUMMARY.md) 执行 [`FULL_DATABASE_SETUP.sql`](./sql/FULL_DATABASE_SETUP.sql)。

---

## 👥 团队邀请功能配置 (Email Setup)

系统支持基于邮箱的团队邀请逻辑：
1. **邀请发送**：管理员在界面输入邮箱，数据库通过 `create_team_invitation` 函数生成 Token 并记录。
2. **Token 验证**：受邀用户点击链接（带有 Token），系统调用 `accept_team_invitation` 验证并自动加入团队。

**注意**：目前邮件发送需配置 Supabase 的 Auth 邮件模板，或通过手动分享链接完成。

---

## 🛡️ 安全与权限 (RLS)

项目全面启用 Supabase Row Level Security (RLS)：
- **数据隔离**：普通成员只能看到所属团队的数据。
- **递归修复**：通过 `is_team_member` 等安全辅助函数（Security Definer）打破了常规策略中的无限递归。
- **权限级别**：Owner (最高权限) > Admin (管理权限) > Member (基础权限)。

---

## 📂 项目架构说明

```
src/
├── components/      # 通用 UI 组件与业务组件
├── pages/           # 路由页面 (Team, Tasks, Reminders 等)
├── hooks/           # 核心业务逻辑 (ReminderEngine, Toast 等)
├── utils/           # 工具函数与常量
└── App.tsx          # 路由分发与全局 Provider
```

---

## ❓ 常见问题排除

### 1. 数据库权限错误 (42501)
- **原因**：RLS 策略未正确加载或 Token 逻辑失效。
- **解决**：重新执行 `FULL_DATABASE_SETUP.sql` 脚本中的策略配置部分。

### 2. 邀请函数栈溢出
- **原因**：旧版 SQL 函数存在内部递归查询。
- **解决**：当前脚本已使用 `SECURITY DEFINER` 和简化逻辑修复此问题。
