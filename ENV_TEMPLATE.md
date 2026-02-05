# 环境变量配置模板

## 📝 创建 .env 文件

在项目根目录创建 `.env` 文件，并填入以下内容：

```env
# ==========================================
# Supabase 配置
# ==========================================

# 项目 URL（必填）
# 在 Supabase Dashboard > Settings > API > Project URL
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Anon/Public Key（必填）
# 在 Supabase Dashboard > Settings > API > Project API keys > anon/public
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==========================================
# 应用配置（可选）
# ==========================================

# 应用名称
VITE_APP_NAME=ProjectFlow

# 应用版本
VITE_APP_VERSION=2.0.0

# ==========================================
# 开发配置（可选）
# ==========================================

# 开发服务器端口（默认 3000）
# VITE_PORT=3000

# 是否自动打开浏览器（默认 true）
# VITE_OPEN=true
```

---

## 🔑 获取 Supabase 凭证

### 步骤 1：登录 Supabase

访问：https://app.supabase.com

### 步骤 2：选择/创建项目

- 如果已有项目：直接选择
- 如果是新项目：点击 **New Project** 创建

### 步骤 3：获取凭证

1. 点击左侧 **Settings** 图标
2. 选择 **API**
3. 找到以下信息：

#### Project URL
```
位置：Configuration > Project URL
格式：https://xxxxxxxxxxxxx.supabase.co
```

#### Anon Key
```
位置：Project API keys > anon public
格式：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
（一串很长的字符）
```

### 步骤 4：复制到 .env

将获取的值替换到 `.env` 文件中：

```env
VITE_SUPABASE_URL=https://你复制的项目URL.supabase.co
VITE_SUPABASE_ANON_KEY=你复制的anon-key
```

---

## ⚠️ 安全注意事项

### ❌ 不要做

- ❌ 不要提交 `.env` 文件到 Git
- ❌ 不要分享您的 `.env` 内容
- ❌ 不要在代码中硬编码密钥
- ❌ 不要使用 Service Role Key（后端专用）

### ✅ 应该做

- ✅ 将 `.env` 添加到 `.gitignore`
- ✅ 使用环境变量读取配置
- ✅ 生产环境使用不同的凭证
- ✅ 定期轮换密钥

---

## 🔍 验证配置

### 方法 1：启动应用

```bash
npm run dev
```

如果配置正确，应该看到：
```
VITE v5.4.21  ready in XXX ms
➜ Local:   http://127.0.0.1:3000/
```

### 方法 2：检查环境变量

在浏览器控制台（F12）执行：

```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);
```

应该显示：
```
URL: https://your-project.supabase.co
Key length: 180+ (一个很长的数字)
```

### 方法 3：测试连接

在应用中尝试注册/登录，如果成功表示配置正确。

---

## 🐛 常见错误

### 错误 1：URL 未定义

**错误信息**：
```
Supabase URL is missing. Please check your environment variables.
```

**解决方案**：
1. 确认 `.env` 文件存在于项目根目录
2. 确认变量名正确：`VITE_SUPABASE_URL`（注意前缀 `VITE_`）
3. 重启开发服务器

### 错误 2：Key 未定义

**错误信息**：
```
Supabase Anon Key is missing.
```

**解决方案**：
1. 确认 `.env` 中有 `VITE_SUPABASE_ANON_KEY`
2. 确认 Key 是完整的（很长的字符串）
3. 确认没有多余的引号或空格

### 错误 3：连接失败

**错误信息**：
```
Failed to fetch / Network error
```

**解决方案**：
1. 检查 Supabase 项目是否正常运行
2. 检查网络连接
3. 确认 URL 格式正确（包含 https://）
4. 确认 URL 末尾没有多余的斜杠

---

## 🔄 不同环境配置

### 开发环境

`.env`（本地开发）：
```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-key...
```

### 生产环境

在 Vercel/Netlify 中配置环境变量：
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-key...
```

⚠️ **注意**：生产和开发使用不同的 Supabase 项目！

---

## 📋 配置检查清单

- [ ] `.env` 文件已创建
- [ ] `VITE_SUPABASE_URL` 已填写
- [ ] `VITE_SUPABASE_ANON_KEY` 已填写
- [ ] URL 格式正确（https://）
- [ ] Key 完整（180+字符）
- [ ] 开发服务器启动成功
- [ ] 应用可以正常访问
- [ ] 可以注册/登录

---

## 🎉 配置完成！

环境变量配置正确后，您可以：

1. ✅ 启动开发服务器
2. ✅ 注册新账号
3. ✅ 使用所有功能
4. ✅ 开始开发

### 下一步

- 执行数据库脚本：`docs/sql/DATABASE_SETUP.sql`
- 配置存储桶：按照 `docs/STORAGE_SETUP.md`
- 开始使用：访问应用

---

**文档版本**: 2.0  
**更新日期**: 2026-01-31
