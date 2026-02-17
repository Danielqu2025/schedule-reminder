# 邀请邮件发送问题排查指南

## 🔍 问题现象
配置了 Supabase SMTP 后，发送团队邀请邮件时没有收到邮件。

## 📋 排查步骤

### 步骤 1：检查 Edge Function 是否已部署

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 左侧菜单 → **Edge Functions**
4. 查看是否有 **send-invitation-email** 函数，状态应为 **已部署**

**如果未部署：**
```powershell
# 1. 确保已安装 Supabase CLI
npm install -g supabase

# 2. 登录 Supabase
supabase login

# 3. 关联项目（替换为你的 Project ID）
supabase link --project-ref hzjvydidqchblriidfuk

# 4. 部署 Edge Function
supabase functions deploy send-invitation-email
```

---

### 步骤 2：检查 Edge Function Secrets（关键！）

Edge Function 需要以下环境变量才能正常工作：

1. 在 Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
2. 确认以下密钥已配置：

| 密钥名称 | 说明 | 获取位置 |
|---------|------|---------|
| `SUPABASE_URL` | 项目 URL | Settings → API → Project URL（通常已自动配置） |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端密钥 | Settings → API → service_role key（点击 Reveal） |
| `RESEND_API_KEY` | Resend API Key | [Resend Dashboard](https://resend.com/api-keys) |

**如何设置 Secrets：**

**方法 1：通过 Dashboard（推荐）**
1. Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
2. 点击 **Add new secret**
3. 添加 `RESEND_API_KEY`，值为你的 Resend API Key（格式：`re_...`）

**方法 2：通过 CLI**
```powershell
supabase secrets set RESEND_API_KEY=你的_resend_api_key
```

> ⚠️ **重要**：即使你配置了 Supabase SMTP，**已注册用户**的邀请邮件必须通过 Resend 发送（因为 Supabase Auth 不会给已注册用户发邀请邮件）。所以 `RESEND_API_KEY` 是必需的！

---

### 步骤 3：检查 Supabase SMTP 配置

1. Dashboard → **Authentication** → **Settings** → **SMTP Settings**
2. 确认已启用 **Custom SMTP**，并填写：
   - SMTP Host: `smtp.resend.com`（如果使用 Resend）
   - SMTP Port: `587`
   - SMTP User: `resend`
   - SMTP Password: 你的 Resend API Key
   - Sender Email: `noreply@resend.dev` 或你的自定义域名邮箱
   - Sender Name: `ProjectFlow`

> 📝 **注意**：Supabase SMTP 主要用于**新用户注册验证邮件**和**密码重置邮件**。团队邀请邮件由 Edge Function 处理。

---

### 步骤 4：检查 Edge Function 日志

1. Dashboard → **Edge Functions** → **send-invitation-email**
2. 点击 **Logs** 标签
3. 尝试发送一次邀请，然后查看日志

**常见错误：**

- `未配置 RESEND_API_KEY`：说明 Edge Function Secrets 中缺少 `RESEND_API_KEY`
- `Resend API 错误`：检查 Resend API Key 是否正确
- `Supabase 配置缺失`：检查 `SUPABASE_SERVICE_ROLE_KEY` 是否配置

---

### 步骤 5：测试邮件发送

#### 测试 1：邀请新用户（未注册邮箱）

1. 使用一个**从未注册过**的邮箱地址发送邀请
2. 这种情况下，Edge Function 会使用 `supabaseAdmin.auth.admin.inviteUserByEmail()`
3. 邮件会通过 **Supabase SMTP** 发送

**如果收不到：**
- 检查 Supabase SMTP 配置是否正确
- 检查邮箱是否在垃圾邮件文件夹
- 检查 Supabase Dashboard → **Authentication** → **Settings** → **Rate Limits**（默认每小时 30 封）

#### 测试 2：邀请已注册用户

1. 使用一个**已注册**的邮箱地址发送邀请
2. 这种情况下，Edge Function 会调用 `sendCustomEmail()`，使用 **Resend API** 发送

**如果收不到：**
- 确认 Edge Function Secrets 中已配置 `RESEND_API_KEY`
- 检查 Resend Dashboard → **Emails** → **Logs**，查看发送状态
- 如果使用 `onboarding@resend.dev` 作为发件人，只能发送给**已验证的邮箱**（Resend 免费版限制）

---

### 步骤 6：配置 Resend 域名（解决 403 错误）

**问题**：如果看到错误 `You can only send testing emails to your own email address`，说明使用了 `onboarding@resend.dev` 作为发件人，Resend 免费版限制只能发送给已验证的邮箱。

**解决方案：验证域名**

1. **在 Resend Dashboard 验证域名**
   - 访问 [Resend Domains](https://resend.com/domains)
   - 点击 **Add Domain**
   - 输入你的域名（如 `yourdomain.com`）
   - 按照提示添加 DNS 记录（SPF、DKIM、DMARC）
   - 等待验证完成（通常几分钟）

2. **配置 Edge Function Secrets**
   - Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
   - 添加以下密钥：
     - `RESEND_FROM_EMAIL`: `noreply@yourdomain.com`（使用你验证的域名）
     - `RESEND_SENDER_NAME`: `ProjectFlow`（可选，邮件显示名称）

3. **重新部署 Edge Function**
   ```powershell
   supabase functions deploy send-invitation-email
   ```

**临时方案（仅用于测试）**：
- 如果暂时无法验证域名，可以：
  1. 在 Edge Function Secrets 中添加 `RESEND_FROM_EMAIL`，值为你的注册邮箱（如 `daniel.qu2018@gmail.com`）
  2. 但这样只能发送给这个邮箱地址

---

## 🔧 快速修复清单

- [ ] Edge Function 已部署：`supabase functions deploy send-invitation-email`
- [ ] Edge Function Secrets 中配置了 `RESEND_API_KEY`
- [ ] Edge Function Secrets 中配置了 `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Supabase SMTP 已配置（用于新用户注册）
- [ ] Resend API Key 有效（在 [Resend Dashboard](https://resend.com/emails) 查看发送日志）
- [ ] 检查 Edge Function 日志是否有错误

---

## 📞 如果仍然无法解决

1. **查看 Edge Function 日志**：Dashboard → Edge Functions → send-invitation-email → Logs
2. **查看 Resend 发送日志**：[Resend Dashboard](https://resend.com/emails) → Emails
3. **检查浏览器控制台**：F12 → Console，查看是否有前端错误
4. **检查网络请求**：F12 → Network，查看 `send-invitation-email` 请求的响应

---

## 💡 邮件发送逻辑说明

```
发送邀请邮件
    │
    ├─→ 新用户（未注册）
    │   └─→ supabaseAdmin.auth.admin.inviteUserByEmail()
    │       └─→ 使用 Supabase SMTP 配置发送
    │
    └─→ 已注册用户
        └─→ sendCustomEmail()
            └─→ 使用 Resend API 发送（需要 RESEND_API_KEY）
```

因此，**两个配置都需要**：
- **Supabase SMTP**：用于新用户注册验证邮件
- **RESEND_API_KEY**：用于已注册用户的邀请邮件
