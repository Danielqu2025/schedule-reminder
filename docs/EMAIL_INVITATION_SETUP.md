# 邮箱邀请功能设置指南

## 概述

团队邀请功能已从 UUID 方式改为邮箱邀请方式。用户可以通过输入邮箱地址邀请成员，被邀请者会收到一封确认邮件，点击确认后即可加入团队。

## 数据库设置

### 步骤 1：执行 SQL 脚本

在 Supabase SQL Editor 中执行 `docs/sql/TEAM_INVITATIONS_SETUP.sql` 文件：

```sql
-- 此脚本会创建：
-- 1. team_invitations 表
-- 2. 相关的索引和约束
-- 3. RLS 策略
-- 4. 数据库函数（create_team_invitation, accept_team_invitation）
```

### 步骤 2：验证表结构

执行后，确认以下内容已创建：
- ✅ `team_invitations` 表
- ✅ 相关索引
- ✅ RLS 策略已启用
- ✅ 数据库函数已创建

## 邮件服务配置

### 使用 Supabase Auth 的邮件功能（推荐）

本项目已配置使用 Supabase Auth 的邮件功能发送邀请邮件。

#### 步骤 1：配置 Supabase 邮件服务

Supabase 默认提供简单的 SMTP 服务器，但有限制（仅限团队成员，每小时 2 封邮件）。生产环境建议配置自定义 SMTP。

**方式一：使用 Supabase 默认邮件服务（开发测试）**
- Supabase 会自动处理邮件发送
- 无需额外配置
- 限制：仅发送给已授权的地址，每小时 2 封

**方式二：配置自定义 SMTP（生产环境推荐）**

1. 登录 Supabase Dashboard
2. 进入 **Authentication** > **SMTP**（路径：`https://supabase.com/dashboard/project/[your-project-ref]/auth/smtp`）
3. 配置 SMTP 服务器：
   - **Host**: 您的 SMTP 服务器地址（如：smtp.gmail.com）
   - **Port**: SMTP 端口（通常为 587 或 465）
   - **User**: SMTP 用户名
   - **Password**: SMTP 密码
   - **Sender email**: 发件人邮箱地址（如：noreply@yourdomain.com）
   - **Sender name**: 发件人名称（如：ProjectFlow）

   **常用 SMTP 配置示例**：
   - **Gmail**: smtp.gmail.com:587（需要应用专用密码）
   - **SendGrid**: smtp.sendgrid.net:587
   - **Resend**: smtp.resend.com:587
   - **Mailgun**: smtp.mailgun.org:587
   - **AWS SES**: email-smtp.region.amazonaws.com:587

4. 点击 **Save** 保存配置

**参考文档**：[Supabase Auth SMTP 配置指南](https://supabase.com/docs/guides/auth/auth-smtp)

#### 步骤 2：配置邮件模板（可选）

1. 进入 **Authentication** > **Email Templates**（路径：`https://supabase.com/dashboard/project/[your-project-ref]/auth/templates`）
2. 选择 **Invite user** 模板
3. 可以自定义邀请邮件的 HTML 模板
4. 在模板中可用的变量：
   - `{{ .ConfirmationURL }}` - 邀请确认链接
   - `{{ .Token }}` - 6 位数字验证码
   - `{{ .Email }}` - 被邀请用户的邮箱
   - `{{ .Data }}` - 用户元数据（包含我们传递的 teamName, inviteUrl 等）
   - `{{ .RedirectTo }}` - 重定向 URL

**参考文档**：[Supabase 邮件模板指南](https://supabase.com/docs/guides/auth/auth-email-templates)

#### 步骤 3：部署 Edge Function

1. 确保已安装 Supabase CLI：
   ```bash
   npm install -g supabase
   ```

2. 登录 Supabase：
   ```bash
   supabase login
   ```

3. 链接到您的项目：
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. 部署 Edge Function：
   ```bash
   supabase functions deploy send-invitation-email
   ```

5. 设置环境变量（Edge Function 会自动使用 Supabase 项目的配置）：
   - `SUPABASE_URL`: 自动从项目配置获取
   - `SUPABASE_SERVICE_ROLE_KEY`: 自动从项目配置获取

#### 步骤 4：验证邮件发送

1. 在应用中创建一个团队邀请
2. 检查被邀请者的邮箱
3. 如果未收到邮件，检查：
   - Supabase Dashboard > Logs > Edge Functions 查看日志
   - SMTP 配置是否正确
   - 邮件是否被标记为垃圾邮件

### 邮件功能说明

- **新用户**：如果被邀请的邮箱未注册，`inviteUserByEmail()` 会发送 Supabase 的默认邀请邮件，用户点击链接后可以注册账户。注册完成后会跳转到我们设置的 `redirectTo` URL（即邀请确认页面）
- **已注册用户**：如果被邀请的邮箱已注册，`inviteUserByEmail()` 可能会失败。当前实现会记录日志，您可以通过以下方式处理：
  1. 使用自定义邮件模板（在 Dashboard 中配置）
  2. 使用 Send Email Hook（完全自定义邮件发送逻辑）
  3. 手动复制邀请链接发送给用户
- **邮件内容**：通过 `data` 参数传递的团队信息（teamName, inviteUrl 等）可以在邮件模板中使用 `{{ .Data }}` 访问

### 故障排除

#### 问题：邮件未发送

**可能原因**：
1. 使用默认 SMTP 但收件地址未授权
2. SMTP 配置不正确
3. Edge Function 未部署
4. 用户已注册导致 `inviteUserByEmail()` 失败

**解决方案**：
1. **检查 Edge Function 日志**：
   - Supabase Dashboard > Logs > Edge Functions
   - 查看是否有错误信息
2. **验证 SMTP 配置**：
   - 如果使用自定义 SMTP，检查 Authentication > SMTP 配置是否正确
   - 测试 SMTP 连接是否正常
3. **处理已注册用户**：
   - 如果用户已注册，`inviteUserByEmail()` 可能失败
   - 可以手动复制邀请链接发送，或配置 Send Email Hook
4. **检查邮件模板**：
   - 确认 Authentication > Email Templates 中的 Invite user 模板配置正确
5. **其他检查**：
   - 检查发件人邮箱的 SPF、DKIM 记录
   - 查看收件箱的垃圾邮件文件夹

#### 问题：邮件内容不正确

**解决方案**：
1. 在 Supabase Dashboard > Authentication > Email Templates 中自定义邮件模板
2. 修改 Edge Function 中的邮件内容（`emailBody` 变量）

### 开发测试（不配置邮件服务）

如果不配置邮件服务，系统仍会创建邀请记录，但不会发送邮件。邀请链接会在 Edge Function 日志中输出，可以手动复制发送给被邀请者。

## 功能说明

### 邀请流程

1. **创建邀请**
   - 团队 Owner 在团队管理页面输入被邀请者的邮箱
   - 系统创建邀请记录并生成唯一令牌
   - 如果配置了邮件服务，系统会发送邀请邮件

2. **接受邀请**
   - 被邀请者点击邮件中的邀请链接
   - 如果未登录，会跳转到登录页面
   - 登录后自动跳转回邀请确认页面
   - 点击"接受邀请"按钮完成加入

3. **邀请状态**
   - `pending`: 待处理
   - `accepted`: 已接受
   - `expired`: 已过期（7天后自动过期）
   - `cancelled`: 已取消

### 安全特性

- ✅ 邀请令牌唯一且不可猜测
- ✅ 邀请链接 7 天后自动过期
- ✅ 邮箱验证：只有被邀请的邮箱对应的账户才能接受邀请
- ✅ 防止重复邀请：同一团队同一邮箱只能有一个待处理的邀请
- ✅ 防止重复加入：如果用户已经是团队成员，无法再次邀请

## 前端路由

新增路由：
- `/invite/accept?token=xxx` - 邀请确认页面（公开访问，无需登录）

## 测试步骤

1. **创建邀请**
   - 登录系统
   - 进入团队管理页面
   - 点击"邀请成员"
   - 输入邮箱地址
   - 点击"发送邀请"

2. **接受邀请**
   - 复制邀请链接（如果未配置邮件服务）
   - 在新浏览器窗口打开链接
   - 如果未登录，先登录（使用被邀请的邮箱）
   - 点击"接受邀请"
   - 验证是否成功加入团队

## 故障排除

### 问题：邀请邮件未发送

**原因**：邮件服务未配置或配置错误

**解决方案**：
1. 检查 Supabase Edge Function 是否已部署
2. 检查邮件服务 API Key 是否正确配置
3. 查看 Edge Function 日志
4. 如果未配置邮件服务，可以手动复制邀请链接发送

### 问题：接受邀请时提示"邮箱不匹配"

**原因**：当前登录的邮箱与邀请的邮箱不一致

**解决方案**：
1. 使用被邀请的邮箱登录
2. 或者联系团队 Owner 重新发送邀请到当前邮箱

### 问题：提示"邀请不存在或已过期"

**原因**：
- 邀请令牌错误
- 邀请已过期（超过 7 天）
- 邀请已被取消

**解决方案**：
1. 联系团队 Owner 重新发送邀请
2. 确认邀请链接完整且未过期

## 注意事项

1. **邮件服务配置**：生产环境强烈建议配置邮件服务，否则用户无法收到邀请邮件
2. **域名配置**：如果使用第三方邮件服务，需要配置发件域名（SPF、DKIM 记录）
3. **邀请过期时间**：默认 7 天，可以在 SQL 函数中修改
4. **批量邀请**：当前版本不支持批量邀请，需要逐个输入邮箱
