// Supabase Edge Function: 通过 CSV 导入用户到 Auth 并加入团队
// 仅团队 owner/admin 可调用。用户首次登录需修改密码。
// 部署: supabase functions deploy import-users-csv
// 需设置 Secret: SUPABASE_ANON_KEY（用于验证调用方 JWT）

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

interface ImportRow {
  email: string;
  password: string;
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: { email: string; reason: string }[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: '缺少 Authorization 头或格式错误' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
    }
    if (!supabaseAnonKey) {
      throw new Error('缺少 SUPABASE_ANON_KEY，请在 Edge Function Secrets 中设置');
    }

    // 使用 anon key 验证调用方 JWT，得到当前用户
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
      error: userError,
    } = await userClient.auth.getUser(authHeader.replace('Bearer ', ''));

    if (userError || !caller) {
      return new Response(
        JSON.stringify({ error: '无效或过期的登录状态，请重新登录' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({})) as { teamId?: number; users?: ImportRow[] };
    const { teamId, users } = body;

    if (teamId == null || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ error: '请求体需包含 teamId（数字）和 users（数组，每项 { email, password }）' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 校验调用方是否为该团队的 owner 或 admin
    const { data: membership, error: memberError } = await admin
      .from('team_members')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', caller.id)
      .single();

    if (memberError || !membership || !['owner', 'admin'].includes(membership.role)) {
      return new Response(
        JSON.stringify({ error: '仅团队管理员或负责人可执行批量导入' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: ImportResult = { created: 0, skipped: 0, errors: [] };
    const normalizedEmails = new Set<string>();

    for (const row of users) {
      const email = (row?.email ?? '').trim().toLowerCase();
      const password = typeof row?.password === 'string' ? row.password : '';

      if (!email) {
        result.errors.push({ email: row?.email ?? '', reason: '邮箱为空' });
        continue;
      }
      if (password.length < 6) {
        result.errors.push({ email, reason: '密码长度至少 6 位' });
        continue;
      }
      if (normalizedEmails.has(email)) {
        result.skipped++;
        continue;
      }
      normalizedEmails.add(email);

      try {
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { need_password_change: true },
        });

        if (createError) {
          if (
            createError.message.includes('already been registered') ||
            createError.message.includes('already exists')
          ) {
            result.skipped++;
            continue;
          }
          result.errors.push({ email, reason: createError.message });
          continue;
        }

        if (!newUser?.user?.id) {
          result.errors.push({ email, reason: '创建用户失败' });
          continue;
        }

        const { error: insertError } = await admin.from('team_members').insert({
          team_id: teamId,
          user_id: newUser.user.id,
          role: 'member',
        });

        if (insertError) {
          if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
            result.skipped++;
          } else {
            result.errors.push({ email, reason: `加入团队失败: ${insertError.message}` });
          }
          continue;
        }

        result.created++;
      } catch (e) {
        result.errors.push({ email, reason: (e as Error).message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        created: result.created,
        skipped: result.skipped,
        errors: result.errors,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('import-users-csv error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || '导入失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
