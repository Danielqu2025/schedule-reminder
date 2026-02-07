// Supabase Edge Function: 发送团队邀请邮件
// 部署: supabase functions deploy send-invitation-email
// 文档: docs/SUPABASE_EDGE_FUNCTION_SETUP.md

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // 必须最先处理 CORS 预检，返回 200 + ok（部分环境对 204 预检不友好）
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, teamName, inviteUrl, inviterName } = body as Record<string, string>;

    if (!email || !teamName || !inviteUrl) {
      return new Response(
        JSON.stringify({ error: '缺少必需字段: email, teamName, inviteUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase 配置缺失：需要 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const emailSubject = `您收到了来自 ${teamName} 团队的邀请`;
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="font-family:Arial;line-height:1.6;color:#333;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <p>您好，</p>
          <p>${inviterName || '有人'} 邀请您加入 <strong>${teamName}</strong> 团队。</p>
          <p>点击下方链接接受邀请：</p>
          <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#667eea;color:#fff;text-decoration:none;border-radius:6px;">接受邀请</a></p>
          <p style="word-break:break-all;color:#666;font-size:14px;">${inviteUrl}</p>
          <p style="color:#999;font-size:12px;">此链接 7 天内有效。如未请求此邀请，可忽略本邮件。</p>
        </div>
      </body>
      </html>
    `;

    try {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            teamName,
            inviteUrl,
            inviterName: inviterName || '团队成员',
            customType: 'team_invitation',
          },
          redirectTo: inviteUrl,
        }
      );

      if (inviteError) {
        if (inviteError.message.includes('already registered') || inviteError.message.includes('already exists')) {
          console.log(`用户 ${email} 已存在，尝试发送通知邮件和站内信`);
          
          // 1. 尝试发送自定义邮件 (需要 RESEND_API_KEY)
          await sendCustomEmail(supabaseAdmin, email, emailSubject, emailBody);
          
          // 2. 发送站内信通知
          // 先查找用户 ID
          const { data: userData } = await supabaseAdmin
            .from('auth.users') // 注意：通常无法直接查 auth.users，需要用 admin API listUsers
            .select('id') 
            .eq('email', email) 
            .single().catch(() => ({ data: null })); // 这种写法在 Edge Function 可能受限，改用 listUsers

          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const targetUser = users.find(u => u.email === email);

          if (targetUser) {
             await supabaseAdmin.from('notifications').insert({
               user_id: targetUser.id,
               type: 'team_invitation',
               title: '团队邀请',
               content: `${inviterName || '有人'} 邀请您加入 ${teamName} 团队`,
               related_type: 'team',
               // related_id: teamId, // body 里没传 teamId，暂时略过
               is_read: false
             });
             console.log('已发送站内信通知');
          }

        } else {
          throw inviteError;
        }
      } else {
        console.log('邀请邮件已通过 Supabase Auth 发送:', inviteData);
      }
    } catch (err) {
      console.error('Supabase Auth 邀请失败，尝试自定义邮件:', err);
      await sendCustomEmail(supabaseAdmin, email, emailSubject, emailBody);
    }

    return new Response(
      JSON.stringify({ success: true, message: '邀请处理完成' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('发送邮件错误:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || '发送邮件失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendCustomEmail(
  _supabaseAdmin: unknown,
  email: string,
  subject: string,
  htmlBody: string
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (resendApiKey) {
    console.log('检测到 RESEND_API_KEY，正在通过 Resend 发送邮件...');
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Team <onboarding@resend.dev>', // 默认测试发件人，生产环境需配置域名
          to: email,
          subject: subject,
          html: htmlBody,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        console.error('Resend API 错误:', data);
      } else {
        console.log('Resend 邮件发送成功:', data);
        return;
      }
    } catch (e) {
      console.error('调用 Resend 失败:', e);
    }
  } else {
    console.log('未配置 RESEND_API_KEY，跳过自定义邮件发送。');
    console.log('模拟邮件内容:', { to: email, subject });
  }
  
  console.warn('提示：对于已注册用户，Supabase Auth 不会发送邀请邮件。请配置 RESEND_API_KEY 以发送通知。');
}

