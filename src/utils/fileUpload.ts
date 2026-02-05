import { supabase } from '../lib/supabaseClient';

/**
 * 支持的文件类型
 */
export const ALLOWED_FILE_TYPES = {
  // 图片
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  
  // 文档
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  
  // 文本
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'text/csv': ['.csv'],
  
  // 数据
  'application/json': ['.json'],
  'application/xml': ['.xml'],
  
  // 压缩包
  'application/zip': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  'application/x-7z-compressed': ['.7z'],
};

/**
 * 文件大小限制（50MB）
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * 验证文件类型
 */
export function validateFileType(file: File): boolean {
  const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
  return allowedTypes.includes(file.type);
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 清理文件名（移除特殊字符）
 */
export function sanitizeFileName(fileName: string): string {
  // 保留文件扩展名
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const ext = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
  
  // 清理文件名
  const cleanName = name
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '_')     // 空格替换为下划线
    .substring(0, 100);        // 限制长度
  
  return cleanName + ext;
}

/**
 * 上传文件到 Supabase Storage
 */
export async function uploadScheduleFile(
  userId: string,
  scheduleId: number,
  updateId: number,
  file: File
): Promise<{ path: string; error?: string }> {
  try {
    // 验证文件
    if (!validateFileType(file)) {
      return { path: '', error: '不支持的文件类型' };
    }
    
    if (!validateFileSize(file)) {
      return { path: '', error: `文件大小不能超过 ${formatFileSize(MAX_FILE_SIZE)}` };
    }
    
    // 生成文件路径
    const timestamp = Date.now();
    const cleanFileName = sanitizeFileName(file.name);
    const fileName = `${timestamp}_${cleanFileName}`;
    const filePath = `${userId}/${scheduleId}/${updateId}/${fileName}`;
    
    // 上传文件
    const { data, error } = await supabase.storage
      .from('schedule-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('文件上传失败:', error);
      return { path: '', error: error.message };
    }
    
    return { path: data.path };
  } catch (error) {
    console.error('文件上传异常:', error);
    return { 
      path: '', 
      error: error instanceof Error ? error.message : '上传失败' 
    };
  }
}

/**
 * 获取文件签名URL（用于下载/预览）
 */
export async function getFileSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('schedule-attachments')
      .createSignedUrl(filePath, expiresIn);
    
    if (error) {
      console.error('获取文件URL失败:', error);
      return null;
    }
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error('获取文件URL异常:', error);
    return null;
  }
}

/**
 * 下载文件
 */
export async function downloadFile(filePath: string, fileName: string): Promise<void> {
  try {
    const { data, error } = await supabase.storage
      .from('schedule-attachments')
      .download(filePath);
    
    if (error) throw error;
    
    // 创建下载链接
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('文件下载失败:', error);
    throw error;
  }
}

/**
 * 删除文件
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('schedule-attachments')
      .remove([filePath]);
    
    if (error) {
      console.error('文件删除失败:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('文件删除异常:', error);
    return false;
  }
}

/**
 * 获取文件类型图标
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
  if (fileType.startsWith('text/')) return '📃';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '📦';
  return '📎';
}
