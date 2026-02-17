# CSV 批量导入用户说明

除「邮箱邀请」外，管理员或团队负责人可通过 **CSV 文件** 批量导入账户与初始密码，用户将直接加入 Supabase Authentication 与当前团队，**首次登录需修改密码**。

---

## 一、功能说明

- **谁可用**：仅当前团队的 **owner** 或 **admin** 在「团队成员」页看到「CSV 导入账户」入口。
- **效果**：CSV 中每一行（邮箱 + 初始密码）会：
  1. 在 Supabase Auth 中创建用户（邮箱已确认，无需邮件验证）；
  2. 将用户加入当前团队，角色为 `member`；
  3. 为用户设置 `user_metadata.need_password_change = true`，首次登录会跳转到「修改密码」页，修改成功后即可正常使用。

---

## 二、CSV 格式

- **编码**：建议 UTF-8。
- **列**：至少两列，顺序固定。
  - 第 1 列：**邮箱**（有效邮箱格式）；
  - 第 2 列：**初始密码**（至少 6 位）。
- **表头**：可选。若第一行为 `email,password` 或 `email,密码`，会自动跳过。
- **样板文件**：项目内已提供 `docs/sample-import-users.csv`，可复制后修改邮箱与密码使用。

- **示例**：

```csv
email,password
user1@example.com,Welcome01
user2@example.com,Welcome02
```

或（无表头）：

```csv
user1@example.com,Welcome01
user2@example.com,Welcome02
```

- 若某邮箱在 Auth 中已存在，该行会被**跳过**（不会覆盖密码），不会报错；若已为团队成员，同样会跳过加入团队。

---

## 三、Edge Function 部署（import-users-csv）

该功能依赖 Edge Function `import-users-csv`，需部署并配置密钥。

### 1. 部署

在项目根目录执行：

```bash
supabase functions deploy import-users-csv
```

### 2. 配置 Secrets

除 Supabase 自带的 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` 外，**必须**设置：

- **SUPABASE_ANON_KEY**：用于在 Edge Function 内验证调用方 JWT（确认是团队 owner/admin）。

在 Dashboard：**Project Settings → Edge Functions → Secrets** 中新增：

- 名称：`SUPABASE_ANON_KEY`
- 值：在 **Settings → API → Project API keys** 中的 **anon (public)** 密钥

或使用 CLI：

```bash
supabase secrets set SUPABASE_ANON_KEY=你的anon密钥
```

设置后无需重新部署，下次调用即生效。

---

## 四、首次登录修改密码流程

1. 管理员通过 CSV 导入用户后，用户使用 **邮箱 + 初始密码** 在登录页登录。
2. 登录成功后，若检测到 `user_metadata.need_password_change === true`，会自动跳转到 **「首次登录请修改密码」** 页（`/change-password`）。
3. 用户输入 **当前密码**、**新密码**、**确认新密码** 并提交。
4. 成功后清除「需修改密码」标记并跳转到首页，之后登录不再强制改密。

---

## 五、安全与注意

- CSV 中包含明文初始密码，请通过安全渠道下发（如加密压缩、安全通讯工具），并建议用户首次登录后立即修改密码（本应用已强制首次修改）。
- 仅团队 owner/admin 可调用导入接口；Edge Function 会再次校验调用方在该团队的 role。
- 不要将 `SUPABASE_SERVICE_ROLE_KEY` 或 CSV 文件提交到公开仓库。
