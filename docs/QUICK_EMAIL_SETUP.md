# 快速邮件设置指南

## 🚨 问题：邀请邮件未发送

如果邀请邮件没有发送，请按照以下步骤检查和配置：

---

## ✅ 步骤 1：部署 Edge Function（必需）

Edge Function 负责发送邀请邮件，必须先部署才能使用。

### 1.1 安装 Supabase CLI

```bash
npm install -g supabase
```

### 1.2 登录 Supabase

```bash
supabase login
```

### 1.3 链接到您的项目

```bash
# 替换 your-project-ref 为您的项目引用 ID
# 项目引用 ID 可以在 Supabase Dashboard > Settings > General 中找到
supabase link --project-ref your-project-ref
```

**如何找到项目引用 ID：**
- 登录 Supabase Dashboard
- 进入 **Settings** > **General**
- 找到 **Reference ID**（格式类似：`rythiccjfjyaxhamnzzm`）

### 1.4 部署 Edge Function

```bash
cd D:\Opencode\schedule-reminder
supabase functions deploy send-invitation-email
```

部署成功后，您会看到类似输出：
```
Deployed Function send-invitation-email
```

### 1.5 验证部署

1. 登录 Supabase Dashboard
2. 进入 **Edge Functions** 页面
3. 确认 `send-invitation-email` 函数已列出

---

## ✅ 步骤 2：配置 SMTP 邮件服务（必需）

Supabase 默认邮件服务有限制，生产环境必须配置自定义 SMTP。

### 2.1 进入 SMTP 配置页面

1. 登录 Supabase Dashboard
2. 进入 **Authentication** > **SMTP**
3. 路径：`https://supabase.com/dashboard/project/[your-project-ref]/auth/smtp`

### 2.2 配置 SMTP 服务器

#### 选项 A：使用 Gmail（开发测试）

1. **启用 Gmail 两步验证**
2. **生成应用专用密码**：
   - 访问：https://myaccount.google.com/apppasswords
   - 选择"邮件"和"其他设备"
   - 复制生成的 16 位密码

3. **在 Supabase 中配置**：
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **User**: 您的 Gmail 地址（如：yourname@gmail.com）
   - **Password**: 刚才生成的应用专用密码（16位）
   - **Sender email**: 您的 Gmail 地址
   - **Sender name**: `ProjectFlow`（可选）

#### 选项 B：使用 SendGrid（生产推荐）

1. **注册 SendGrid 账户**：https://sendgrid.com
2. **创建 API Key**：
   - 进入 Settings > API Keys
   - 创建新的 API Key，选择"Full Access"
   - 复制 API Key

3. **在 Supabase 中配置**：
   - **Host**: `smtp.sendgrid.net`
   - **Port**: `587`
   - **User**: `apikey`
   - **Password**: 您的 SendGrid API Key
   - **Sender email**: 已验证的发件人邮箱
   - **Sender name**: `ProjectFlow`

#### 选项 C：使用 Resend（推荐，简单易用）

1. **注册 Resend**：https://resend.com
2. **创建 API Key**
3. **在 Supabase 中配置**：
   - **Host**: `smtp.resend.com`
   - **Port**: `587`
   - **User**: `resend`
   - **Password**: 您的 Resend API Key
   - **Sender email**: 已验证的域名邮箱（如：noreply@yourdomain.com）
   - **Sender name**: `ProjectFlow`

### 2.3 保存配置

点击 **Save** 保存 SMTP 配置。

---

## ✅ 步骤 3：配置邮件模板（可选但推荐）

自定义邮件模板可以让邀请邮件更美观。

### 3.1 进入邮件模板页面

1. Supabase Dashboard > **Authentication** > **Email Templates**
2. 选择 **Invite user** 模板

### 3.2 自定义模板内容

可以使用以下变量：
- `{{ .ConfirmationURL }}` - 邀请确认链接（Supabase Auth 生成的）
- `{{ .Token }}` - 6 位数字验证码
- `{{ .Email }}` - 被邀请用户的邮箱
- `{{ .Data.teamName }}` - 团队名称
- `{{ .Data.inviteUrl }}` - 邀请链接（我们自定义的）
- `{{ .Data.inviterName }}` - 邀请人名称

**示例模板：**

```html
<h2>团队邀请</h2>
<p>您好，</p>
<p>{{ .Data.inviterName }} 邀请您加入 <strong>{{ .Data.teamName }}</strong> 团队。</p>
<p>点击下面的链接接受邀请：</p>
<p><a href="{{ .Data.inviteUrl }}">接受邀请</a></p>
<p>或者复制以下链接：</p>
<p>{{ .Data.inviteUrl }}</p>
<p>此邀请将在 7 天后过期。</p>
```

---

## ✅ 步骤 4：测试邮件发送

### 4.1 在应用中测试

1. 登录应用
2. 进入团队管理页面
3. 点击"邀请成员"
4. 输入测试邮箱地址
5. 点击"发送邀请"

### 4.2 检查邮件

- 检查收件箱
- 检查垃圾邮件文件夹
- 如果未收到，继续下一步排查

---

## 🔍 步骤 5：故障排除

### 5.1 检查 Edge Function 日志

1. Supabase Dashboard > **Logs** > **Edge Functions**
2. 选择 `send-invitation-email` 函数
3. 查看最近的日志，查找错误信息

**常见错误：**
- `Supabase 配置缺失` - Edge Function 环境变量未设置（自动设置，通常不会出现）
- `already registered` - 用户已存在，会尝试发送自定义邮件
- `SMTP connection failed` - SMTP 配置错误

### 5.2 检查浏览器控制台

1. 打开浏览器开发者工具（F12）
2. 切换到 **Console** 标签
3. 发送邀请时查看是否有错误信息

### 5.3 验证 Edge Function 是否可访问

在浏览器中测试 Edge Function 端点：

```javascript
// 在浏览器控制台执行（替换为您的实际值）
fetch('https://rythiccjfjyaxhamnzzm.supabase.co/functions/v1/send-invitation-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    teamName: '测试团队',
    inviteUrl: 'http://localhost:3000/invite/accept?token=test',
    inviterName: '测试用户'
  })
})
.then(res => res.json())
.then(data => console.log('结果:', data))
.catch(err => console.error('错误:', err));
```

### 5.4 检查 SMTP 配置

1. 确认 SMTP 配置已保存
2. 测试 SMTP 连接（Supabase Dashboard 通常有测试按钮）
3. 确认发件人邮箱已验证（对于某些服务）

---

## 📋 快速检查清单

- [ ] Edge Function 已部署（Supabase Dashboard > Edge Functions）
- [ ] SMTP 已配置（Authentication > SMTP）
- [ ] 邮件模板已配置（可选，Authentication > Email Templates）
- [ ] 浏览器控制台无错误
- [ ] Edge Function 日志无错误
- [ ] 检查了垃圾邮件文件夹

---

## 🆘 如果仍然无法发送邮件

### 临时解决方案：手动发送邀请链接

即使邮件未发送，邀请记录已创建。您可以：

1. **查看邀请链接**：
   - 在应用中发送邀请后，浏览器控制台会显示邀请链接
   - 或者从数据库查询 `team_invitations` 表获取 `token`

2. **手动发送**：
   - 复制邀请链接：`http://your-domain.com/invite/accept?token=xxx`
   - 通过其他方式（微信、QQ、邮件客户端）发送给被邀请者

### 联系支持

如果以上步骤都无法解决问题，请：
1. 收集 Edge Function 日志
2. 收集浏览器控制台错误
3. 检查 Supabase Dashboard 中的错误信息
4. 提交 Issue 或联系技术支持

---

## 📚 参考文档

- [Supabase Edge Functions 文档](https://supabase.com/docs/guides/functions)
- [Supabase Auth SMTP 配置](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase 邮件模板](https://supabase.com/docs/guides/auth/auth-email-templates)
