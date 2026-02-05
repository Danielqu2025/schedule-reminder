# 🚀 快速开始指南

## ProjectFlow - 团队项目管理系统

一个现代化的团队协作和项目管理平台，支持个人日程、团队任务、WBS工作分解和统计分析。

---

## ⚡ 3 步完成部署

### 步骤 1：数据库设置（5分钟）

1. 注册/登录 [Supabase](https://app.supabase.com)
2. 创建新项目
3. 进入 **SQL Editor**
4. 复制并执行：`docs/sql/DATABASE_SETUP.sql`

✅ 这将创建所有必要的表、索引和安全策略

---

### 步骤 2：配置存储（3分钟）

#### 创建存储桶

1. 在 Supabase Dashboard 点击 **Storage**
2. 点击 **New bucket**
3. 配置：
   ```
   Name: schedule-attachments
   Public: ❌ Private
   File Size Limit: 50MB
   ```

#### 配置存储策略

在 **SQL Editor** 执行：

```sql
-- 允许用户上传到自己的文件夹
CREATE POLICY "Users can upload files to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'schedule-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户查看自己的文件
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'schedule-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 允许用户删除自己的文件
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'schedule-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### 步骤 3：配置应用（2分钟）

1. 复制 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 在 Supabase Dashboard 获取凭证：
   - **Settings** → **API**
   - 复制 `Project URL` 和 `anon/public key`

3. 填写 `.env` 文件：
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. 安装依赖并启动：
   ```bash
   npm install
   npm run dev
   ```

5. 访问：`http://127.0.0.1:3000`

---

## ✨ 核心功能

### 📅 个人日程管理
- 创建日程（支持日期范围）
- 阶段性更新记录
- 附件上传（图片、PDF、Word、Excel等）
- 状态追踪

### 👥 团队协作
- 创建和管理团队
- 成员角色管理（Owner、Admin、Member）
- 邮箱邀请机制
- 工作组划分

### 📋 任务管理
- 任务创建和分配
- 优先级管理
- WBS 工作分解
- 进度追踪

### 📊 统计分析
- 个人日程统计
- 团队任务分析
- 完成率计算
- 可视化图表

---

## 📂 项目结构

```
schedule-reminder/
├── docs/                          # 📚 文档
│   ├── sql/
│   │   └── DATABASE_SETUP.sql    # 完整数据库脚本
│   ├── DESIGN_SYSTEM.md          # 设计系统
│   ├── ICON_SYSTEM.md            # 图标系统
│   ├── STORAGE_SETUP.md          # 存储配置详解
│   ├── SCHEDULE_UPDATE_GUIDE.md  # 日程功能指南
│   └── DEVELOPMENT_GUIDE.md      # 开发指南
├── src/
│   ├── components/               # React 组件
│   ├── pages/                    # 页面组件
│   ├── utils/                    # 工具函数
│   ├── types/                    # TypeScript 类型
│   └── lib/                      # 核心库
├── supabase/functions/           # Edge Functions
└── GETTING_STARTED.md           # 本文档
```

---

## 🎨 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Supabase (PostgreSQL + Auth + Storage)
- **样式**: CSS3 (Claude.ai 深色主题)
- **图标**: Lucide React
- **路由**: React Router v6

---

## 📖 详细文档

| 文档 | 说明 |
|------|------|
| `docs/SCHEDULE_UPDATE_GUIDE.md` | 日程功能使用指南（含示例） |
| `docs/STORAGE_SETUP.md` | 文件上传配置详解 |
| `docs/DESIGN_SYSTEM.md` | UI设计系统说明 |
| `docs/ICON_SYSTEM.md` | 图标使用规范 |
| `docs/DEVELOPMENT_GUIDE.md` | 开发指南 |

---

## 🔍 功能测试清单

部署完成后，测试以下功能：

### 个人日程
- [ ] 创建日程（启动/完成日期）
- [ ] 添加更新记录
- [ ] 上传附件（PDF、图片等）
- [ ] 更新状态
- [ ] 下载附件
- [ ] 删除日程

### 团队功能
- [ ] 创建团队
- [ ] 邀请成员（邮箱）
- [ ] 创建工作组
- [ ] 分配成员到工作组

### 任务管理
- [ ] 创建任务
- [ ] WBS 工作分解
- [ ] 分配任务给成员
- [ ] 更新进度
- [ ] 添加评论

### 统计分析
- [ ] 查看个人日程统计
- [ ] 查看团队任务统计
- [ ] 筛选日期范围

---

## ⚙️ 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 现代浏览器（支持 ES6+）

---

## 🐛 故障排查

### 数据库连接失败
```javascript
// 检查 .env 配置
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### 文件上传失败
- 确认存储桶已创建：`schedule-attachments`
- 确认存储策略已执行
- 检查浏览器控制台错误

### RLS 权限错误
```sql
-- 验证策略
SELECT * FROM pg_policies 
WHERE schemaname = 'public';
```

### 热更新不生效
```bash
# 清除缓存重启
rm -rf node_modules/.vite
npm run dev
```

---

## 📞 获取帮助

- 📖 查看详细文档：`docs/` 目录
- 🔍 检查浏览器控制台
- 📊 查看 Supabase Dashboard 日志
- 🐛 提交 Issue（包含错误信息和环境）

---

## 🎯 下一步

1. **自定义配置**：修改 `src/config/` 中的配置
2. **调整样式**：查看 `docs/DESIGN_SYSTEM.md`
3. **添加功能**：参考 `docs/DEVELOPMENT_GUIDE.md`
4. **部署生产**：配置 Vercel/Netlify

---

## 📝 版本信息

- **当前版本**: 2.0
- **发布日期**: 2026-01-31
- **最低要求**: Node 18+, Supabase 免费计划

---

## 🎉 完成！

恭喜！您的 ProjectFlow 系统已准备就绪。

开始探索功能：
1. 📅 创建您的第一个日程
2. 👥 组建您的团队
3. 📋 开始管理项目

**祝您使用愉快！** 🚀
