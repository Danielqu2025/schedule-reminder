# Supabase Storage 配置指南

## 📦 存储桶配置

### 1. 创建存储桶

在 Supabase Dashboard 中创建存储桶用于存储日程附件。

#### 步骤：

1. 访问 Supabase Dashboard
2. 进入 **Storage** 页面
3. 点击 **New bucket**
4. 配置如下：

```
名称：schedule-attachments
公开访问：❌ Private (私有)
文件大小限制：50MB（建议）
允许的文件类型：所有类型
```

---

## 🔐 存储策略配置

### 2. 配置存储桶策略

在 Supabase SQL Editor 中执行以下 SQL，配置文件访问权限：

```sql
-- ==========================================
-- Storage 策略：schedule-attachments
-- ==========================================

-- 1. 允许用户上传文件到自己的文件夹
CREATE POLICY "Users can upload files to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'schedule-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. 允许用户查看自己的文件
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'schedule-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. 允许用户删除自己的文件
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'schedule-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. 允许用户更新自己的文件
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'schedule-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 📂 文件结构规范

### 存储路径格式

```
schedule-attachments/
  ├── {user_id}/
  │   ├── {schedule_id}/
  │   │   ├── {update_id}/
  │   │   │   ├── {timestamp}_{filename}.ext
  │   │   │   └── ...
```

### 示例

```
schedule-attachments/
  ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890/  (用户ID)
  │   ├── 123/  (日程ID)
  │   │   ├── 456/  (更新记录ID)
  │   │   │   ├── 1706745600000_report.pdf
  │   │   │   ├── 1706745700000_chart.xlsx
  │   │   │   └── 1706745800000_photo.jpg
```

---

## 📋 支持的文件类型

### 图片
- `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`

### 文档
- `.pdf` - PDF文档
- `.doc`, `.docx` - Word文档
- `.xls`, `.xlsx` - Excel表格
- `.ppt`, `.pptx` - PowerPoint演示
- `.txt`, `.md` - 文本文件

### 其他
- `.zip`, `.rar` - 压缩包
- `.csv` - CSV数据
- `.json`, `.xml` - 数据文件

### 文件大小限制
- 单个文件：**50MB**（可在存储桶设置中调整）
- 总存储空间：根据 Supabase 计划

---

## 🔧 前端使用示例

### 上传文件

```typescript
import { supabase } from './supabaseClient';

async function uploadFile(
  userId: string,
  scheduleId: number,
  updateId: number,
  file: File
): Promise<string> {
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;
  const filePath = `${userId}/${scheduleId}/${updateId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('schedule-attachments')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;
  return data.path;
}
```

### 获取文件URL

```typescript
async function getFileUrl(filePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from('schedule-attachments')
    .createSignedUrl(filePath, 3600); // 1小时有效期

  return data?.signedUrl || '';
}
```

### 下载文件

```typescript
async function downloadFile(filePath: string) {
  const { data, error } = await supabase.storage
    .from('schedule-attachments')
    .download(filePath);

  if (error) throw error;
  
  // 创建下载链接
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filePath.split('/').pop() || 'file';
  a.click();
  URL.revokeObjectURL(url);
}
```

### 删除文件

```typescript
async function deleteFile(filePath: string) {
  const { error } = await supabase.storage
    .from('schedule-attachments')
    .remove([filePath]);

  if (error) throw error;
}
```

---

## 🛡️ 安全建议

### 1. 文件验证
- ✅ 在前端验证文件类型和大小
- ✅ 在后端（Edge Function）进行二次验证
- ✅ 扫描文件病毒（如果需要）

### 2. 文件命名
- ✅ 使用时间戳避免文件名冲突
- ✅ 清理文件名中的特殊字符
- ✅ 限制文件名长度

### 3. 访问控制
- ✅ 使用 RLS 策略保护文件
- ✅ 生成临时签名URL
- ✅ 设置合理的过期时间

### 4. 存储管理
- ✅ 定期清理未使用的文件
- ✅ 监控存储空间使用
- ✅ 设置文件保留期限

---

## 📊 监控和维护

### 查询存储使用情况

```sql
-- 查看每个用户的文件数量和总大小
SELECT 
  (storage.foldername(name))[1] as user_id,
  COUNT(*) as file_count,
  SUM(metadata->>'size')::bigint as total_size_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) as total_size_mb
FROM storage.objects
WHERE bucket_id = 'schedule-attachments'
GROUP BY user_id
ORDER BY total_size_bytes DESC;
```

### 清理孤立文件

```sql
-- 查找没有对应数据库记录的文件
-- 注意：仅供参考，实际清理需要自定义逻辑
SELECT name, created_at 
FROM storage.objects 
WHERE bucket_id = 'schedule-attachments'
  AND name NOT IN (
    SELECT file_path FROM schedule_attachments
  );
```

---

## ✅ 配置检查清单

- [ ] 创建 `schedule-attachments` 存储桶
- [ ] 设置为私有（Private）
- [ ] 配置文件大小限制（50MB）
- [ ] 执行 Storage 策略 SQL
- [ ] 测试文件上传功能
- [ ] 测试文件下载功能
- [ ] 测试文件删除功能
- [ ] 验证 RLS 权限正常工作

---

## 🔗 相关文档

- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)
- [存储策略文档](https://supabase.com/docs/guides/storage/security/access-control)
- [文件上传最佳实践](https://supabase.com/docs/guides/storage/uploads)

---

**更新日期：** 2026-01-31
