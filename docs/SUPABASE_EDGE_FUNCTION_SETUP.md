# Supabase Edge Function 部署与配置指南

本文档指导您在 Supabase 中**一步步**部署并配置 `send-invitation-email`（含 CORS 与鉴权），并在前端成功创建邀请后调用该函数。

---

## 一、前置条件

- 已安装 [Node.js](https://nodejs.org/)（建议 18+）
- 已有一个 Supabase 项目（如 `scewuzopntegumyekgbf`）
- 本地已克隆本项目并完成数据库配置

---

## 二、安装 Supabase CLI

### Windows（PowerShell）

```powershell
# 使用 npm 全局安装
npm install -g supabase
```

### 验证安装

```powershell
supabase --version
```

---

## 三、登录并关联项目

### 1. 登录 Supabase

```powershell
supabase login
```

浏览器会打开 Supabase 登录页，登录后 CLI 会保存凭证。

### 2. 关联本地项目到远程项目

在项目根目录执行：

```powershell
cd D:\Opencode\schedule-reminder
supabase link --project-ref scewuzopntegumyekgbf
```

- `scewuzopntegumyekgbf` 请替换为您的 **Project ID**。
- Project ID 在 Supabase Dashboard 的 **Settings → General → Reference ID** 中查看。

按提示输入数据库密码（创建项目时设置的密码）。

---

## 四、配置 Edge Function 密钥（鉴权与邮件）

Edge Function 需要用到 **SUPABASE_SERVICE_ROLE_KEY**（服务端密钥，仅服务端使用，不要暴露到前端）。

### 1. 获取 Service Role Key

1. 打开 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 左侧 **Settings** → **API**
4. 在 **Project API keys** 中找到 **service_role**（secret）
5. 点击 **Reveal** 复制密钥（形如 `eyJhbGci...`）

### 2. 在 Supabase 中设置密钥

Dashboard 中：

1. **Project Settings** → **Edge Functions**
2. 找到 **Secrets**（或 **Environment Variables**）
3. 添加/确认以下密钥：
   - `SUPABASE_URL`：项目 URL（一般已存在）
   - `SUPABASE_SERVICE_ROLE_KEY`：service_role 密钥
   - `RESEND_API_KEY`：[Resend](https://resend.com) 的 API Key（必需）
   - `RESEND_FROM_EMAIL`：发件人邮箱（可选，如 `noreply@yourdomain.com`，需在 Resend 验证域名）
   - `RESEND_SENDER_NAME`：发件人名称（可选，如 `ProjectFlow`）
   - **若使用 CSV 批量导入用户**（Edge Function `import-users-csv`）：需额外设置 `SUPABASE_ANON_KEY`（Settings → API → anon public key），用于在函数内验证调用方 JWT。详见 [CSV 批量导入用户说明](./CSV_USER_IMPORT.md)。

若使用 CLI 设置（可选）：

```powershell
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=你的_service_role_密钥 RESEND_API_KEY=你的_resend_api_key
```

> 注意：`SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 在部署 Edge Function 时通常已由 Supabase 自动注入。


---

## 五、部署 send-invitation-email

在项目根目录执行：

```powershell
cd D:\Opencode\schedule-reminder
supabase functions deploy send-invitation-email
```

- 首次部署会构建并上传函数，可能需要 1–2 分钟。
- 成功后会输出函数 URL，形如：  
  `https://scewuzopntegumyekgbf.supabase.co/functions/v1/send-invitation-email`

### 可选：关闭 JWT 校验（仅当需要匿名调用时）

默认情况下，调用 Edge Function 会校验 JWT（推荐保留）。若您希望仅通过 anon key 调用且不校验用户 JWT，可使用：

```powershell
supabase functions deploy send-invitation-email --no-verify-jwt
```

本项目前端使用**已登录用户的 session** 调用，建议**不要**使用 `--no-verify-jwt`，保持默认鉴权。

---

## 六、CORS 与鉴权说明

### CORS

- 函数内已配置 CORS 头：`Access-Control-Allow-Origin: *`、`Access-Control-Allow-Methods: POST, OPTIONS`、`Access-Control-Allow-Headers` 等。
- 对 **OPTIONS** 预检请求返回 **204**，浏览器即可正常发起跨域 POST。

### 鉴权

- 前端使用 **Supabase 客户端** 的 `supabase.functions.invoke('send-invitation-email', { body: {...} })` 调用。
- 客户端会自动在请求头中带上当前用户的 **JWT**（`Authorization: Bearer <user_access_token>`）。
- Edge Function 默认会校验该 JWT；校验通过才会执行逻辑，从而保证只有登录用户能发邀请邮件。

---

## 七、前端：成功创建邀请后调用函数

前端逻辑已恢复为：

1. 在 **team_invitations** 表中插入邀请记录（含 token）。
2. 调用 Edge Function：`supabase.functions.invoke('send-invitation-email', { body: { email, teamName, inviteUrl, inviterName } })`。
3. 若调用成功：提示「邀请邮件已发送」。
4. 若调用失败（网络、CORS、未部署等）：提示「邀请已创建，请将链接发送给受邀人：xxx」，并展示邀请链接。

无需再在前端写 `fetch(..., { headers: { Authorization: Bearer anon_key } })`，使用 `supabase.functions.invoke` 即可自动带鉴权并减少 CORS 问题。

---

## 八、验证部署是否成功

### 1. 在 Dashboard 中查看

1. Supabase Dashboard → **Edge Functions**
2. 应看到 **send-invitation-email**，状态为已部署

### 2. 使用 curl 测试（可选）

```powershell
curl -X POST "https://scewuzopntegumyekgbf.supabase.co/functions/v1/send-invitation-email" `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer 你的_anon_key" `
  -d "{\"email\":\"test@example.com\",\"teamName\":\"测试团队\",\"inviteUrl\":\"https://example.com/invite/accept?token=abc\",\"inviterName\":\"管理员\"}"
```

- 将 `你的_anon_key` 替换为项目 **anon/public** key。
- 若返回 `{"success":true,"message":"邀请邮件已发送"}` 或业务错误（如缺少字段），说明函数已部署且 CORS/鉴权正常。

### 3. 在应用中测试

1. 登录项目
2. 进入某个团队 → 邀请成员 → 输入邮箱并提交
3. 若提示「邀请邮件已发送」，说明 Edge Function 调用成功；若提示「邀请已创建，请将链接发送给受邀人：…」，说明邀请已写入数据库，但发邮件一步失败（可检查网络、CORS、密钥、SMTP 等）

---

## 九、常见问题

### 1. CORS 报错：Response to preflight request doesn't pass access control check

- 确认已按本文部署的是**更新后的** Edge Function（OPTIONS 返回 204，且带完整 CORS 头）。
- 重新部署：`supabase functions deploy send-invitation-email`，然后清除浏览器缓存再试。

### 2. 401 Unauthorized

- 前端必须使用**已登录用户**的 Supabase 客户端调用（不要只用 anon key 的 fetch）。
- 使用 `supabase.functions.invoke('send-invitation-email', { body: {...} })` 会自动带用户 JWT。

### 3. 500 或「Supabase 配置缺失」

- 在 Dashboard → **Project Settings → Edge Functions → Secrets** 中确认已设置 `SUPABASE_SERVICE_ROLE_KEY`（或由 Supabase 自动注入）。

### 4. 邮件未真正发出

- 当前逻辑会优先使用 `auth.admin.inviteUserByEmail`；若邮箱未注册，Supabase 会发邀请邮件。
- 若邮箱已注册，**会自动切换到 Resend 服务发送邀请邮件**。
- 如果看到错误 `You can only send testing emails to your own email address`：
  - **原因**：使用 `onboarding@resend.dev` 只能发送给已验证的邮箱（通常是注册 Resend 的邮箱）
  - **解决**：在 [Resend Dashboard](https://resend.com/domains) 验证域名，然后在 Edge Function Secrets 中添加 `RESEND_FROM_EMAIL`（如 `noreply@yourdomain.com`）
  - 重新部署 Edge Function：`supabase functions deploy send-invitation-email`


---

## 十、小结

| 步骤 | 说明 |
|------|------|
| 1 | 安装 Supabase CLI：`npm install -g supabase` |
| 2 | 登录：`supabase login` |
| 3 | 关联项目：`supabase link --project-ref <项目ID>` |
| 4 | 设置密钥：`SERVICE_ROLE_KEY` 与 `RESEND_API_KEY` |

| 5 | 部署：`supabase functions deploy send-invitation-email` |
| 6 | 前端使用 `supabase.functions.invoke('send-invitation-email', { body })` 在创建邀请后调用 |

完成以上步骤后，send-invitation-email 即已在 Supabase 中部署并配置好 CORS 与鉴权，前端在成功创建邀请后会自动调用该函数发送邀请邮件（或在失败时回退为展示邀请链接）。
