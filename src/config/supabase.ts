// Supabase 配置
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 验证环境变量
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const missingVars = [];
  if (!SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY');
  
  throw new Error(
    `缺少 Supabase 配置！\n\n` +
    `缺少的环境变量：${missingVars.join(', ')}\n\n` +
    `请执行以下步骤：\n` +
    `1. 复制 .env.example 文件为 .env\n` +
    `2. 在 .env 文件中填入您的 Supabase 配置\n` +
    `3. 重启开发服务器\n\n` +
    `详细说明请查看 README.md`
  );
}

export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};

