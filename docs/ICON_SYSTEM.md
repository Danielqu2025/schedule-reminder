# 图标系统文档

## 🎨 图标库选择

本项目使用 **Lucide React** 图标库，一个现代、简洁、科技感强的开源图标库。

### 安装
```bash
npm install lucide-react
```

### 特点
- ✅ 现代科技风格，线条简洁
- ✅ 完美适配新材料科技主题
- ✅ Tree-shakeable，只打包使用的图标
- ✅ 支持自定义大小、颜色、线宽
- ✅ TypeScript 支持

---

## 📦 图标使用规范

### 基本用法
```tsx
import { IconName } from 'lucide-react';

<IconName size={20} strokeWidth={2} />
```

### 尺寸规范
- **Logo/品牌**: 20-24px
- **导航图标**: 18-20px
- **按钮图标**: 16-18px
- **卡片/内联图标**: 14-16px
- **空状态图标**: 48px

### 线宽规范
- **品牌/Logo**: 2.5
- **导航/主要元素**: 2
- **次要元素**: 1.5

---

## 🎯 全局图标映射

### 导航菜单 (Layout)

| 位置 | 旧图标 | 新图标 | 说明 |
|------|--------|--------|------|
| Logo | 📅 | `<Hexagon />` | 六边形 - 代表材料晶体结构 |
| 个人日程 | 🗓️ | `<CalendarClock />` | 日历+时钟 - 日程管理 |
| 团队概览 | 🏢 | `<Layers />` | 层叠 - 团队协作层次 |
| 任务管理 | 📋 | `<ListChecks />` | 检查列表 - 任务清单 |
| 工作分解 | 🧱 | `<Network />` | 网络 - WBS 结构 |
| 统计报告 | 📊 | `<BarChart3 />` | 柱状图 - 数据分析 |
| 退出登录 | 🚪 | `<LogOut />` | 登出图标 |
| 通知 | 🔔 | `<Bell />` | 铃铛 - 消息提醒 |
| 展开/收起 | ❮❯ | `<PanelLeftClose />` `<PanelLeftOpen />` | 面板切换 |

---

### 个人日程页面 (PersonalSchedulePage)

| 功能 | 旧图标 | 新图标 | 说明 |
|------|--------|--------|------|
| 添加日程按钮 | + | `<Plus />` | 加号 |
| 取消按钮 | - | `<XCircle />` | 叉号圆圈 |
| 时间信息 | 🕒 | `<Clock />` | 时钟 |
| 删除按钮 | 🗑️ | `<Trash2 />` | 垃圾桶 |
| 空状态 | 📅 | `<CalendarDays />` | 日历图标 |

**状态图标：**
- 待办：`<Circle />` (空心圆)
- 进行中：`<Clock />` (时钟)
- 已完成：`<CheckCircle2 />` (勾选圆圈)
- 已取消：`<XCircle />` (叉号圆圈)

---

### 团队概览页面 (TeamOverviewPage)

| 功能 | 旧图标 | 新图标 | 说明 |
|------|--------|--------|------|
| 创建团队按钮 | + | `<Plus />` | 加号 |
| 日期显示 | 📅 | `<Calendar />` | 日历 |
| 进入团队 | ❯ | `<ChevronRight />` | 右箭头 |
| 空状态 | 🏢 | `<Layers />` | 层叠图标 |

---

### 任务管理页面 (TaskManagementPage)

| 功能 | 旧图标 | 新图标 | 说明 |
|------|--------|--------|------|
| 团队标识 | 🏢 | `<Layers />` | 层叠 - 团队 |
| 截止时间 | ⏰ | `<Clock />` | 时钟 - 倒计时 |

---

### 统计报告页面 (StatisticsPage)

| 功能 | 旧图标 | 新图标 | 说明 |
|------|--------|--------|------|
| 页面标题 | 📊 | 移除 | 图标在标题前已有装饰符 |
| 待办统计 | 📋 | `<Circle />` | 空心圆 |
| 进行中统计 | 🔄 | `<BarChart3 />` | 柱状图 |
| 已完成统计 | ✅ | `<CheckCircle2 />` | 勾选圆圈 |
| 已取消统计 | ❌ | `<XCircle />` | 叉号圆圈 |

---

### Toast 通知组件 (Toast)

| 类型 | 旧图标 | 新图标 | 说明 |
|------|--------|--------|------|
| 成功 | ✅ | `<CheckCircle2 />` | 勾选圆圈 |
| 错误 | ❌ | `<XCircle />` | 叉号圆圈 |
| 警告 | ⚠️ | `<AlertCircle />` | 警告圆圈 |
| 信息 | ℹ️ | `<Info />` | 信息图标 |
| 关闭按钮 | × | `<X />` | 叉号 |

---

## 🎨 科技风格图标指南

### 推荐的科技感图标

#### 材料/结构类
- `<Hexagon />` - 六边形（晶体结构）
- `<Box />` - 立方体（材料样品）
- `<Layers />` - 层叠（材料层次）
- `<Grid />` - 网格（分子结构）
- `<Network />` - 网络（原子连接）

#### 科技/创新类
- `<Zap />` - 闪电（能量、创新）
- `<Cpu />` - 芯片（科技）
- `<Atom />` - 原子（科学）
- `<Binary />` - 二进制（数字化）
- `<Braces />` - 代码符号（技术）

#### 数据/分析类
- `<BarChart3 />` - 柱状图
- `<LineChart />` - 折线图
- `<PieChart />` - 饼图
- `<TrendingUp />` - 上升趋势
- `<Activity />` - 活动监测

#### 操作/交互类
- `<Plus />` - 添加
- `<Trash2 />` - 删除
- `<Edit />` - 编辑
- `<Save />` - 保存
- `<Send />` - 发送

---

## 💡 使用示例

### 导航图标
```tsx
import { CalendarClock } from 'lucide-react';

<NavLink to="/" className="nav-item">
  <span className="nav-icon">
    <CalendarClock size={20} strokeWidth={2} />
  </span>
  <span className="nav-text">个人日程</span>
</NavLink>
```

### 按钮图标
```tsx
import { Plus, XCircle } from 'lucide-react';

<button className="add-btn">
  {showForm ? <XCircle size={18} /> : <Plus size={18} />}
  <span>{showForm ? '取消' : '添加日程'}</span>
</button>
```

### 状态图标（带文字）
```tsx
import { CheckCircle2 } from 'lucide-react';

<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
  <CheckCircle2 size={14} />
  已完成
</span>
```

### 大型空状态图标
```tsx
import { CalendarDays } from 'lucide-react';

<div className="empty-icon">
  <CalendarDays size={48} strokeWidth={1.5} />
</div>
```

---

## 🎯 颜色与样式

### CSS 样式控制

图标会继承父元素的 `color` 属性，也可以通过 `stroke` 属性单独控制：

```css
.nav-icon svg {
  color: var(--text-secondary);
  transition: color 0.2s;
}

.nav-item.active .nav-icon svg {
  color: var(--accent-orange);
  stroke: var(--accent-orange);
}
```

### 悬停效果
```css
.icon-btn:hover svg {
  color: var(--accent-orange);
  stroke: var(--accent-orange);
}
```

---

## 📝 图标添加流程

1. **选择图标**：访问 [Lucide Icons](https://lucide.dev/) 查找合适的图标
2. **导入图标**：在组件顶部导入
   ```tsx
   import { IconName } from 'lucide-react';
   ```
3. **使用图标**：按照尺寸规范使用
   ```tsx
   <IconName size={20} strokeWidth={2} />
   ```
4. **更新文档**：在本文档中记录新图标的使用

---

## 🔧 图标自定义

### Props 说明
```tsx
<Icon
  size={20}           // 图标大小 (number | string)
  color="currentColor" // 颜色
  strokeWidth={2}     // 线条宽度
  absoluteStrokeWidth // 固定线宽（不随缩放变化）
  className="..."     // CSS 类名
  style={{...}}       // 内联样式
/>
```

### 旋转动画示例
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-icon svg {
  animation: spin 1s linear infinite;
}
```

---

## 📊 图标资源

- **官方文档**: https://lucide.dev/
- **图标搜索**: https://lucide.dev/icons/
- **GitHub**: https://github.com/lucide-icons/lucide
- **NPM**: https://www.npmjs.com/package/lucide-react

---

## ✅ 优化效果

### 替换前（Emoji）
- ❌ 不同平台显示不一致
- ❌ 无法精确控制尺寸
- ❌ 颜色固定，无法匹配主题
- ❌ 缺乏科技感

### 替换后（Lucide Icons）
- ✅ 跨平台一致显示
- ✅ 精确控制尺寸和线宽
- ✅ 完美匹配深色主题
- ✅ 现代科技风格
- ✅ 支持动画和交互效果
- ✅ 更小的打包体积

---

**版本：** 1.0  
**更新日期：** 2026-01-31  
**图标库：** Lucide React
