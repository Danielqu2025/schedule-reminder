# Resend 域名验证完整指南

本指南将一步一步指导你在 Resend 中验证域名，以便可以发送邮件给任何收件人。

---

## 📋 前置条件

- 已注册 [Resend](https://resend.com) 账号
- 拥有一个域名（例如：`yourdomain.com`）
- 可以访问域名的 DNS 管理面板（通常在域名注册商处）

---

## 🚀 步骤 1：登录 Resend Dashboard

1. 访问 [Resend Dashboard](https://resend.com/login)
2. 使用你的账号登录（如果没有账号，先注册）

---

## 🚀 步骤 2：进入 Domains 页面

1. 登录后，点击左侧菜单的 **Domains**
2. 或者直接访问：https://resend.com/domains

---

## 🚀 步骤 3：添加域名

1. 在 Domains 页面，点击右上角的 **Add Domain** 按钮
2. 在弹出的对话框中：
   - **Domain Name**：输入你的域名（例如：`yourdomain.com`）
   - **Region**：选择区域（推荐选择 **North Virginia (us-east-1)**，这是免费版唯一可用的区域）
3. 点击 **Add Domain**

> 💡 **提示**：建议使用子域名（如 `mail.yourdomain.com` 或 `noreply.yourdomain.com`）来隔离发送声誉，而不是使用主域名。

---

## 🚀 步骤 4：获取 DNS 记录配置

添加域名后，Resend 会显示需要添加的 DNS 记录：

### 4.1 SPF 记录

**记录类型**：`TXT`  
**主机名/名称**：`@` 或 `yourdomain.com`（取决于你的 DNS 提供商）  
**值/内容**：类似这样
```
v=spf1 include:_resend.com ~all
```

### 4.2 DKIM 记录

**记录类型**：`TXT`  
**主机名/名称**：`resend._domainkey` 或 `resend._domainkey.yourdomain.com`  
**值/内容**：Resend 会提供一个长字符串，类似：
```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...
```

> 📝 **重要**：每个域名的 DKIM 值都是唯一的，请复制 Resend 提供的完整值。

---

## 🚀 步骤 5：在域名注册商处添加 DNS 记录

### 5.1 登录你的域名注册商

常见的域名注册商：
- GoDaddy
- Namecheap
- Cloudflare
- 阿里云
- 腾讯云
- 其他 DNS 服务商

### 5.2 找到 DNS 管理页面

通常在以下位置：
- **域名管理** → **DNS 设置**
- **域名解析**
- **DNS 记录管理**

### 5.3 添加 SPF 记录

1. 点击 **添加记录** 或 **Add Record**
2. 选择记录类型：**TXT**
3. 填写信息：
   - **主机名/名称**：`@`（或留空，取决于你的 DNS 提供商）
   - **值/内容**：`v=spf1 include:_resend.com ~all`
   - **TTL**：保持默认（通常 3600 或 1 hour）
4. 点击 **保存** 或 **确认**

### 5.4 添加 DKIM 记录

1. 再次点击 **添加记录**
2. 选择记录类型：**TXT**
3. 填写信息：
   - **主机名/名称**：`resend._domainkey`（注意：不要包含域名，只填写 `resend._domainkey`）
   - **值/内容**：粘贴 Resend 提供的完整 DKIM 值（通常很长）
   - **TTL**：保持默认
4. 点击 **保存** 或 **确认**

> ⚠️ **常见错误**：
> - DKIM 主机名写成了 `resend._domainkey.yourdomain.com`（应该是 `resend._domainkey`）
> - 值/内容没有完整复制（DKIM 值通常很长，要完整复制）
> - 记录类型选错了（应该是 TXT，不是 CNAME）

---

## 🚀 步骤 6：验证 DNS 记录

### 6.1 回到 Resend Dashboard

1. 在 Resend Domains 页面，找到你刚添加的域名
2. 点击域名进入详情页
3. 点击 **Verify DNS Records** 按钮

### 6.2 等待验证

- Resend 会自动检查 DNS 记录
- 验证时间取决于你的 DNS 提供商：
  - **Cloudflare**：通常 **1-5 分钟**（最快）
  - **其他提供商**：通常 **5-30 分钟**，最长可能 **24-48 小时**
- 可以在 Resend Dashboard 中查看验证状态：
  - **Pending**：正在验证中
  - **Verified**：✅ 验证成功
  - **Failure**：验证失败（检查 DNS 记录是否正确）

### 6.3 检查验证状态

如果状态显示 **Pending**：
- **Cloudflare 用户**：等待 **1-5 分钟**后再点击 **Verify DNS Records**
- **其他 DNS 提供商**：等待 **10-30 分钟**后再检查
- DNS 记录传播需要时间，请耐心等待

> 💡 **Cloudflare 用户特别提示**：
> - Cloudflare 的 DNS 传播非常快，通常 **1-5 分钟**内生效
> - 如果使用 Cloudflare 代理（橙色云朵），TTL 固定为 5 分钟
> - 如果使用 DNS Only（灰色云朵），可以设置更短的 TTL（30-60 秒）
> - 即使 DNS 已传播，本地 DNS 缓存可能还需要额外时间更新

如果状态显示 **Failure**：
- 检查 DNS 记录是否正确添加
- 确认主机名和值是否完全匹配 Resend 提供的内容
- 可以使用在线 DNS 检查工具验证：
  - [MXToolbox](https://mxtoolbox.com/spf.aspx) - 检查 SPF 记录
  - [DKIM Validator](https://dkimvalidator.com/) - 检查 DKIM 记录

---

## 🚀 步骤 7：配置 Edge Function Secrets

域名验证成功后，需要更新 Supabase Edge Function 的配置：

### 7.1 通过 Supabase Dashboard（推荐）

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. **Project Settings** → **Edge Functions** → **Secrets**
4. 找到 **RESEND_FROM_EMAIL**，点击编辑
5. 更新值为：`noreply@yourdomain.com`（替换为你的域名）
6. 点击 **Save**

### 7.2 通过 CLI（可选）

```powershell
cd D:\Opencode\schedule-reminder
npx supabase secrets set RESEND_FROM_EMAIL=noreply@yourdomain.com
```

> 📝 **提示**：
> - 可以使用任何前缀，如 `noreply@`、`mail@`、`team@` 等
> - 确保使用已验证的域名（例如：`noreply@yourdomain.com`）

---

## 🚀 步骤 8：测试邮件发送

1. 在应用中尝试发送团队邀请
2. 发送给任何邮箱地址（不再限制于注册邮箱）
3. 检查收件箱（包括垃圾邮件文件夹）

---

## ✅ 验证清单

完成以下所有步骤后，你的域名就配置好了：

- [ ] 在 Resend Dashboard 添加了域名
- [ ] 在域名注册商处添加了 SPF 记录（TXT 类型）
- [ ] 在域名注册商处添加了 DKIM 记录（TXT 类型）
- [ ] Resend 显示域名状态为 **Verified**
- [ ] 更新了 Supabase Edge Function Secrets 中的 `RESEND_FROM_EMAIL`
- [ ] 测试发送邮件成功

---

## 🔧 常见问题排查

### 问题 1：DNS 记录添加后，Resend 仍然显示 Pending

**解决方案**：
- **Cloudflare 用户**：等待 **1-5 分钟**后再检查
- **其他 DNS 提供商**：等待 **10-30 分钟**后再检查
- 确认 DNS 记录的主机名和值完全正确
- 使用在线工具验证 DNS 记录是否已生效：
  - [whatsmydns.net](https://www.whatsmydns.net/) - 全球 DNS 传播检查
  - [dnschecker.org](https://dnschecker.org/) - DNS 记录检查工具

### 问题 2：DKIM 验证失败

**可能原因**：
- DKIM 主机名错误（应该是 `resend._domainkey`，不是 `resend._domainkey.yourdomain.com`）
- DKIM 值不完整（需要完整复制 Resend 提供的值）
- 记录类型错误（应该是 TXT，不是 CNAME）

**解决方案**：
- 检查 DNS 记录，确保主机名和值完全匹配
- 删除错误的记录，重新添加正确的记录

### 问题 3：SPF 验证失败

**可能原因**：
- SPF 值错误
- 主机名错误（应该是 `@` 或留空）

**解决方案**：
- 确认 SPF 值为：`v=spf1 include:_resend.com ~all`
- 检查是否已有其他 SPF 记录（一个域名只能有一个 SPF 记录，需要合并）

### 问题 4：邮件仍然发送失败

**检查清单**：
- [ ] 域名在 Resend 中显示为 **Verified**
- [ ] `RESEND_FROM_EMAIL` 已更新为域名邮箱（如 `noreply@yourdomain.com`）
- [ ] Edge Function 已重新部署（如果修改了代码）
- [ ] 检查 Edge Function 日志，查看具体错误信息

---

## 📚 参考资源

- [Resend Domains 文档](https://resend.com/docs/dashboard/domains/introduction)
- [DNS 提供商指南](https://resend.com/docs/dashboard/domains/introduction#need-specific-help-with-a-provider-view-our-knowledge-base-dns-guides)
- [Supabase Edge Functions 文档](https://supabase.com/docs/guides/functions)

---

## 🎉 完成！

配置完成后，你就可以：
- ✅ 发送邮件给任何邮箱地址
- ✅ 使用自定义域名邮箱作为发件人
- ✅ 提高邮件送达率（避免进入垃圾邮件）

如有问题，请查看 Edge Function 日志或联系支持。
