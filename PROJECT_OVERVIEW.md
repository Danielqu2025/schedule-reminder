# ProjectFlow 项目概览

## 📊 项目信息

| 项目 | 信息 |
|------|------|
| **项目名称** | ProjectFlow - 团队项目管理系统 |
| **当前版本** | 2.5.0 |
| **发布日期** | 2026-02-05 |
| **技术栈** | React + TypeScript + Supabase |
| **设计风格** | Claude.ai 深色主题 + 新材料科技元素 |
| **许可证** | MIT |

---

## 🎯 项目定位

ProjectFlow 是一个面向**新材料科技创新项目**的现代化团队协作和项目管理平台，提供：

- 📅 个人日程管理（支持阶段性更新和附件）
- 👥 团队协作和成员管理
- 📋 任务管理和 WBS 工作分解
- 📊 统计分析和数据可视化

**目标用户**：
- 科研团队和实验室
- 技术创新项目组
- 产品研发团队
- 需要细致进度追踪的项目

---

## ✨ 核心特性

### 1. 个人日程管理 2.0

**灵活的日期管理**
- 计划启动日期（必填）
- 计划完成日期（可选）
- 适应不同时长的任务

**阶段性更新系统**
- 记录每个阶段的进展
- 描述成果和遇到的问题
- 可选择性更新状态
- 完整的历史追踪

**多格式附件支持**
- 图片：JPG, PNG, GIF, WebP, SVG
- 文档：PDF, Word, Excel, PowerPoint
- 文本：TXT, MD, CSV
- 其他：ZIP, RAR, JSON, XML
- 单文件最大 50MB

### 2. 团队协作

**团队管理**
- 创建和管理多个团队
- 成员角色：Owner、Admin、Member
- 灵活的工作组划分
- 邮箱邀请机制

**权限控制**
- Owner：完全控制权
- Admin：管理权限（不能删除团队）
- Member：基础访问权限

### 3. 任务与 WBS

**任务管理**
- 创建团队任务
- 优先级设置（高、中、低）
- 开始/截止日期
- 任务分配

**WBS 工作分解**
- 将任务拆分为子项
- 并行/串行执行模式
- 工时估算
- 进度追踪（0-100%）
- 实际完成时间记录

### 4. 统计分析

**个人统计**
- 日程完成率
- 状态分布（待办、进行中、已完成、已取消）
- 时间范围筛选

**团队统计**
- 任务完成情况
- 优先级分布
- 成员工作量
- 可视化图表

---

## 🏗️ 技术架构

### 前端架构

```
React 应用
├── 路由层 (React Router)
├── 页面层 (Pages)
├── 组件层 (Components)
├── 状态管理 (React Hooks)
├── 工具层 (Utils)
└── 类型层 (TypeScript Types)
```

### 后端架构

```
Supabase 服务
├── PostgreSQL 数据库
│   ├── 10+ 核心表
│   ├── RLS 安全策略
│   └── 性能索引
├── Authentication
│   ├── Email/Password
│   └── JWT Token
├── Storage
│   └── schedule-attachments (私有桶)
└── Edge Functions
    └── send-invitation-email
```

### 数据流

```
用户操作
    ↓
React 组件
    ↓
Supabase Client
    ↓
RLS 策略验证
    ↓
PostgreSQL 数据库
    ↓
返回数据
    ↓
React 状态更新
    ↓
UI 重新渲染
```

---

## 🗄️ 数据库设计

### ER 关系图（简化版）

```
User (auth.users)
  ↓
  ├─→ schedules (1:N)
  │     ├─→ schedule_updates (1:N)
  │     │     └─→ schedule_attachments (1:N)
  │     
  └─→ teams (N:M via team_members)
        ├─→ work_groups (1:N)
        │     └─→ work_group_members (N:M)
        │
        ├─→ tasks (1:N)
        │     ├─→ work_items (1:N)
        │     │     └─→ work_item_status_history (1:N)
        │     └─→ task_comments (1:N)
        │
        └─→ team_invitations (1:N)
```

### 核心表说明

| 表 | 记录数预估 | 主要用途 |
|---|-----------|---------|
| schedules | 100-1000/用户 | 个人日程 |
| schedule_updates | 10-50/日程 | 更新记录 |
| schedule_attachments | 0-20/更新 | 文件附件 |
| schedule_tags | 1-10/日程 | 标签 |
| teams | 1-10/用户 | 团队信息 |
| team_members | 5-50/团队 | 成员关系 |
| tasks | 10-100/团队 | 任务列表 |
| work_items | 5-30/任务 | WBS 分解 |
| task_attachments | 0-15/任务 | 任务附件 |
| task_dependencies | 1-20/任务 | 依赖关系 |
| notifications | 0-100/用户 | 通知 |
| audit_logs | 10-1000/月 | 审计日志 |

---

## 🎨 设计理念

### 视觉设计

**色彩系统**
- 主背景：`#1a1a1a` (温暖深灰)
- 卡片：`#2d2d2d` (深灰)
- 强调：`#d97757` (橙色)
- 文字：`#e8e8e8` (柔和白)

**按钮设计**
- 主按钮：白色背景 + 深色文字（Claude.ai 风格）
- 次按钮：深色背景 + 浅色文字
- 图标按钮：橙色悬停效果

**科技元素**
- 六边形 Logo（晶体结构）
- 网格背景（分子结构）
- 渐变线条（材料层次）
- 蓝青渐变（科技感）

### 交互设计

**原则**
- 简洁直观，减少学习成本
- 及时反馈，所有操作有响应
- 容错性强，重要操作需确认
- 流畅动画，提升体验

**动画**
- 0.2s 悬停效果
- 0.4s 页面切换
- 0.6s 图表渲染

---

## 🔐 安全设计

### 认证与授权

**认证方式**
- Email + Password
- JWT Token（Supabase Auth）

**授权级别**
```
个人数据：
  ├─ 仅创建者可访问
  └─ RLS 策略强制执行

团队数据：
  ├─ Owner：完全控制
  ├─ Admin：管理权限
  └─ Member：基础访问
```

### 数据安全

**传输安全**
- HTTPS 加密通信
- JWT Token 认证

**存储安全**
- RLS 数据隔离
- 私有存储桶
- 签名 URL（临时访问）

**代码安全**
- SQL 注入防护（参数化查询）
- XSS 防护（React 自动转义）
- CSRF 防护（JWT Token）

---

## 📈 性能优化

### 数据库优化

**索引策略**
- 用户ID索引（高频查询）
- 日期索引（排序查询）
- 组合索引（多条件查询）
- 外键索引（关联查询）

**查询优化**
- 使用 `select()` 指定字段
- 使用 `limit()` 限制结果
- 避免 N+1 查询
- 使用关联查询替代多次请求

### 前端优化

**代码分割**
- 路由级别懒加载
- 组件按需加载

**资源优化**
- 图标库 Tree-shaking
- CSS 按需加载
- 图片懒加载

**缓存策略**
- Vite 构建优化
- 浏览器缓存
- Service Worker（计划）

---

## 🚀 部署架构

### 推荐方案

**前端部署**
- Vercel / Netlify（推荐）
- GitHub Pages
- 自建服务器

**后端服务**
- Supabase（托管 PostgreSQL + Auth + Storage）

**优势**
- 零运维成本
- 自动扩展
- 全球 CDN
- HTTPS 证书自动管理

---

## 📊 项目统计

### 代码量（估算）

| 类型 | 数量 | 说明 |
|------|------|------|
| TypeScript 文件 | 30+ | 组件和工具 |
| CSS 文件 | 11 | 页面和组件样式 |
| SQL 脚本 | 1 | 完整数据库脚本 |
| 文档 | 10+ | Markdown 文档 |

### 功能模块

| 模块 | 页面数 | 组件数 |
|------|--------|--------|
| 个人日程 | 1 | 2 |
| 团队协作 | 2 | 3 |
| 任务管理 | 2 | 5 |
| 统计分析 | 1 | 4 |
| 通用组件 | - | 3 |

---

## 🎓 学习路径

### 新手开发者

1. **了解基础**：React + TypeScript
2. **阅读文档**：GETTING_STARTED.md
3. **运行项目**：本地开发环境
4. **学习代码**：从简单组件开始
5. **参与贡献**：修复小 Bug

### 高级开发者

1. **架构理解**：数据库设计和 RLS 策略
2. **功能扩展**：添加新模块
3. **性能优化**：查询和渲染优化
4. **安全加固**：权限和数据安全
5. **技术分享**：撰写技术文档

---

## 🗺️ 路线图

### 短期计划（1-3个月）

- [ ] 日程编辑功能
- [ ] 图片附件预览
- [ ] PDF 在线查看
- [ ] 拖拽上传文件
- [ ] 移动端适配优化
- [ ] 性能监控

### 中期计划（3-6个月）

- [ ] 实时协作（WebSocket）
- [ ] 消息通知系统
- [ ] 团队日历视图
- [ ] 高级报表导出
- [ ] 单元测试覆盖
- [ ] 自动化部署

### 长期计划（6-12个月）

- [ ] 移动端原生应用
- [ ] 插件系统
- [ ] API 开放平台
- [ ] 第三方集成（钉钉、飞书）
- [ ] AI 辅助功能
- [ ] 多语言支持

---

## 📞 联系方式

### 项目维护

- **主要维护者**：Development Team
- **代码审查**：Core Team
- **文档维护**：Documentation Team

### 社区

- **GitHub**：[项目主页](https://github.com/your-org/schedule-reminder)
- **Discord**：[社区频道](https://discord.gg/your-server)
- **Email**：support@projectflow.com

---

## 🙏 致谢

### 开源项目

- [Supabase](https://supabase.com/) - 强大的后端即服务平台
- [React](https://react.dev/) - 优秀的前端框架
- [Lucide](https://lucide.dev/) - 精美的图标库
- [Vite](https://vitejs.dev/) - 快速的构建工具

### 设计灵感

- [Claude.ai](https://claude.ai/) - UI 设计风格参考
- [Linear](https://linear.app/) - 项目管理理念
- [Notion](https://notion.so/) - 内容组织方式

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

<div align="center">

**ProjectFlow - 让项目管理更简单**

[开始使用](./GETTING_STARTED.md) • [查看文档](./docs/README.md) • [参与贡献](./CONTRIBUTING.md)

</div>
