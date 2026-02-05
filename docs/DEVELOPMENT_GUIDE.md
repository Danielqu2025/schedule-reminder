# 开发指南

本指南面向开发者，提供详细的开发环境配置、代码规范、测试和部署流程。

---

## 📋 目录

- [环境配置](#环境配置)
- [项目结构](#项目结构)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [数据库开发](#数据库开发)
- [测试指南](#测试指南)
- [部署流程](#部署流程)
- [常见问题](#常见问题)

---

## 🔧 环境配置

### 前置要求

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 18.0.0 | JavaScript 运行时 |
| npm | >= 9.0.0 | 包管理器 |
| Git | 最新版本 | 版本控制 |
| Supabase | 免费计划 | 后端服务 |
| VSCode | 推荐 | 代码编辑器 |

### VSCode 扩展推荐

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "supabase.supabase-vscode"
  ]
}
```

### 克隆和安装

```bash
# 克隆项目
git clone <repository-url>
cd schedule-reminder

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
# 填写 Supabase URL 和 Key
```

### 环境变量

创建 `.env` 文件：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 可选：开发环境配置
VITE_APP_NAME=ProjectFlow
VITE_APP_VERSION=2.0.0
```

---

## 📂 项目结构

### 目录说明

```
schedule-reminder/
├── docs/                          # 📚 项目文档
│   ├── sql/                       # SQL 脚本
│   │   └── DATABASE_SETUP.sql    # 完整数据库脚本
│   ├── DESIGN_SYSTEM.md          # 设计系统
│   ├── ICON_SYSTEM.md            # 图标规范
│   ├── STORAGE_SETUP.md          # 存储配置
│   └── ...
├── src/
│   ├── components/               # 🧩 可复用组件
│   │   ├── Layout/              # 布局组件
│   │   │   ├── Layout.tsx
│   │   │   └── Layout.css
│   │   └── Toast/               # 通知组件
│   ├── pages/                   # 📄 页面组件
│   │   ├── LoginPage.tsx
│   │   ├── PersonalSchedulePage.tsx
│   │   ├── TeamOverviewPage.tsx
│   │   ├── TaskManagementPage.tsx
│   │   └── ...
│   ├── utils/                   # 🛠️ 工具函数
│   │   ├── fileUpload.ts       # 文件上传
│   │   └── validation.ts       # 表单验证
│   ├── types/                   # 📝 TypeScript 类型
│   │   └── database.ts         # 数据库类型
│   ├── hooks/                   # 🪝 React Hooks
│   │   ├── useToast.tsx
│   │   └── useNotifications.ts
│   ├── lib/                     # 📚 核心库
│   │   └── supabaseClient.ts
│   ├── config/                  # ⚙️ 配置文件
│   │   └── supabase.ts
│   ├── index.css               # 🎨 全局样式
│   └── main.tsx                # 🚀 入口文件
├── supabase/
│   └── functions/              # ⚡ Edge Functions
│       └── send-invitation-email/
├── .env.example                # 环境变量模板
├── GETTING_STARTED.md          # 快速开始
└── README.md                   # 项目说明
```

### 命名约定

- **组件文件**：PascalCase (e.g., `PersonalSchedulePage.tsx`)
- **工具函数**：camelCase (e.g., `fileUpload.ts`)
- **样式文件**：与组件同名 (e.g., `Layout.css`)
- **类型文件**：camelCase (e.g., `database.ts`)

---

## 💻 开发流程

### 1. 启动开发服务器

```bash
npm run dev
```

访问：`http://127.0.0.1:3000`

### 2. 开发新功能

```bash
# 创建特性分支
git checkout -b feature/your-feature-name

# 开发...
# 提交代码
git add .
git commit -m "feat: 添加新功能"

# 推送分支
git push origin feature/your-feature-name
```

### 3. 代码检查

```bash
# ESLint 检查
npm run lint

# TypeScript 类型检查
npm run type-check
```

### 4. 构建项目

```bash
# 生产构建
npm run build

# 预览构建结果
npm run preview
```

---

## 📐 代码规范

### TypeScript

```typescript
// ✅ 好的实践
interface User {
  id: string;
  email: string;
  name?: string;
}

const fetchUser = async (id: string): Promise<User> => {
  // 实现...
};

// ❌ 避免
const fetchUser = async (id: any): Promise<any> => {
  // ...
};
```

### React 组件

```typescript
// ✅ 好的实践：函数组件 + TypeScript
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

export default function MyComponent({ title, onSubmit }: Props) {
  return <div>{title}</div>;
}

// ❌ 避免：未定义 Props 类型
export default function MyComponent({ title, onSubmit }) {
  return <div>{title}</div>;
}
```

### CSS 规范

```css
/* ✅ 好的实践：使用 CSS 变量 */
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

/* ❌ 避免：硬编码颜色 */
.card {
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 10px;
}
```

### Git 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```bash
# 格式
<type>(<scope>): <subject>

# 类型
feat:     新功能
fix:      修复 Bug
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构（不是新增功能或修复 Bug）
perf:     性能优化
test:     测试相关
chore:    构建过程或辅助工具的变动

# 示例
feat(schedule): 添加附件上传功能
fix(auth): 修复登录状态丢失问题
docs(readme): 更新安装说明
```

---

## 🗄️ 数据库开发

### 添加新表

1. **修改 SQL 脚本**：`docs/sql/DATABASE_SETUP.sql`

```sql
-- 添加新表
CREATE TABLE IF NOT EXISTS your_table (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_your_table_user_id ON your_table(user_id);

-- 启用 RLS
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

-- 添加策略
CREATE POLICY "Users can view their own data" 
  ON your_table FOR SELECT 
  USING (auth.uid() = user_id);
```

2. **更新 TypeScript 类型**：`src/types/database.ts`

```typescript
export interface YourTable {
  id: number;
  user_id: string;
  name: string;
  created_at: string;
}
```

3. **测试 SQL**：在 Supabase SQL Editor 中执行

### 修改现有表

```sql
-- 添加字段
ALTER TABLE schedules ADD COLUMN new_field VARCHAR(100);

-- 删除字段
ALTER TABLE schedules DROP COLUMN old_field;

-- 修改字段
ALTER TABLE schedules ALTER COLUMN name TYPE VARCHAR(500);
```

---

## 🧪 测试指南

### 手动测试清单

#### 个人日程
- [ ] 创建日程（必填字段验证）
- [ ] 添加更新记录
- [ ] 上传附件（各种文件类型）
- [ ] 下载附件
- [ ] 更新状态
- [ ] 删除日程

#### 团队功能
- [ ] 创建团队
- [ ] 邀请成员
- [ ] 分配角色
- [ ] 创建工作组
- [ ] 删除团队

#### 任务管理
- [ ] 创建任务
- [ ] WBS 分解
- [ ] 分配任务
- [ ] 更新进度
- [ ] 添加评论

### 测试数据

使用测试账号：

```
Email: test@example.com
Password: Test123456!
```

---

## 🚀 部署流程

### Vercel 部署

1. **连接 GitHub**：在 Vercel 导入项目

2. **环境变量**：添加生产环境变量
   ```
   VITE_SUPABASE_URL=production-url
   VITE_SUPABASE_ANON_KEY=production-key
   ```

3. **构建设置**：
   ```
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **部署**：推送到 `main` 分支自动部署

### Netlify 部署

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## ❓ 常见问题

### 数据库权限错误

**问题**：`permission denied for table xxx`

**解决方案**：
1. 检查 RLS 策略是否正确
2. 确认用户已登录（`auth.uid()` 不为空）
3. 在 Supabase Dashboard 查看 RLS 日志

```sql
-- 临时禁用 RLS 测试（仅开发环境）
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
```

### 文件上传失败

**问题**：`Storage error: Access denied`

**解决方案**：
1. 确认存储桶已创建
2. 检查 Storage 策略
3. 确认文件路径符合规则

```sql
-- 查看存储策略
SELECT * FROM pg_policies 
WHERE schemaname = 'storage';
```

### 热更新不生效

**问题**：修改代码后页面不更新

**解决方案**：
```bash
# 清除缓存
rm -rf node_modules/.vite
rm -rf dist

# 重新安装
npm install

# 重启服务器
npm run dev
```

### TypeScript 类型错误

**问题**：类型不匹配

**解决方案**：
1. 确保 `database.ts` 类型定义与数据库一致
2. 使用 `as` 类型断言（谨慎使用）
3. 使用 `unknown` 而非 `any`

```typescript
// ✅ 好的实践
const data = response.data as Schedule;

// ❌ 避免
const data = response.data as any;
```

---

## 📞 获取帮助

- 📖 查看项目文档：`docs/` 目录
- 🐛 提交 Issue：GitHub Issues
- 💬 团队讨论：Slack/Discord
- 📧 联系维护者：your-email@example.com

---

## 🔗 相关资源

- [Supabase 文档](https://supabase.com/docs)
- [React 文档](https://react.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Vite 文档](https://vitejs.dev/)
- [Lucide Icons](https://lucide.dev/)

---

**最后更新**: 2026-01-31  
**维护者**: Development Team
