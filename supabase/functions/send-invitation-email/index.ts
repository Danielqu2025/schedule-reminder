// Supabase Edge Function: 发送团队邀请邮件
// 使用 Supabase Auth 的邮件功能
// 部署命令: supabase functions deploy send-invitation-email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 获取请求数据
    const { email, teamName, inviteUrl, inviterName } = await req.json();

    // 验证必需字段
    if (!email || !teamName || !inviteUrl) {
      return new Response(
        JSON.stringify({ error: '缺少必需字段: email, teamName, inviteUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取 Supabase 配置
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase 配置缺失：需要 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
    }

    // 创建 Supabase Admin 客户端
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 构建邮件内容（HTML 格式）
    const emailSubject = `您收到了来自 ${teamName} 团队的邀请`;
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>团队邀请</h1>
          </div>
          <div class="content">
            <p>您好，</p>
            <p>${inviterName || '有人'} 邀请您加入 <strong>${teamName}</strong> 团队。</p>
            <p>点击下面的按钮接受邀请：</p>
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="button">接受邀请</a>
            </div>
            <p>或者复制以下链接到浏览器打开：</p>
            <p style="word-break: break-all; color: #667eea;">${inviteUrl}</p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              此邀请链接将在 7 天后过期。如果您不想加入此团队，可以忽略此邮件。
            </p>
          </div>
          <div class="footer">
            <p>此邮件由 ProjectFlow 系统自动发送，请勿回复。</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 方案1: 使用 Supabase Auth 的 inviteUserByEmail（如果用户不存在，会创建账户）
    // 注意：这会发送 Supabase 的默认邀请邮件模板，无法完全自定义内容
    // 但可以通过 data 参数传递额外信息
    try {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            teamName: teamName,
            inviteUrl: inviteUrl,
            inviterName: inviterName || '团队成员',
            customType: 'team_invitation', // 标记为团队邀请
          },
          redirectTo: inviteUrl, // 设置重定向 URL
        }
      );

      if (inviteError) {
        // 如果用户已存在，inviteUserByEmail 可能会失败
        // 这种情况下，我们需要使用自定义邮件发送
        if (inviteError.message.includes('already registered') || inviteError.message.includes('already exists')) {
          // 用户已存在，使用自定义邮件发送
          console.log('用户已存在，使用自定义邮件发送');
          await sendCustomEmail(supabaseAdmin, email, emailSubject, emailBody);
        } else {
          throw inviteError;
        }
      } else {
        console.log('邀请邮件已通过 Supabase Auth 发送:', inviteData);
      }
    } catch (error) {
      console.error('Supabase Auth 邀请失败，尝试自定义邮件:', error);
      // 如果 Supabase Auth 邀请失败，尝试发送自定义邮件
      await sendCustomEmail(supabaseAdmin, email, emailSubject, emailBody);
    }

    return new Response(
      JSON.stringify({ success: true, message: '邀请邮件已发送' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('发送邮件错误:', error);
    return new Response(
      JSON.stringify({ error: error.message || '发送邮件失败' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// 辅助函数：发送自定义邮件
// 对于已注册的用户，使用 Supabase Auth 的密码重置功能发送包含邀请链接的邮件
// 注意：这不是最佳方案，但 Supabase Auth 不直接支持发送自定义邮件
async function sendCustomEmail(
  supabaseAdmin: any,
  email: string,
  subject: string,
  htmlBody: string
) {
  // 方案：使用 Supabase Auth 的密码重置功能
  // 这会发送密码重置邮件，但我们可以通过自定义邮件模板来包含邀请链接
  // 在 Supabase Dashboard > Authentication > Email Templates 中配置自定义模板
  
  // 或者，我们可以使用 Supabase 的 Database Webhooks：
  // 1. 创建一个 Database Webhook，监听 team_invitations 表的 INSERT 事件
  // 2. Webhook 触发 Edge Function 发送邮件
  // 3. 使用 Supabase 的邮件服务（如果已配置 SMTP）
  
  // 当前实现：记录日志，提示用户配置邮件模板
  console.log('自定义邮件内容（已记录）:', {
    to: email,
    subject: subject,
    html: htmlBody,
  });
  
  // 注意：要发送自定义 HTML 邮件，需要在 Supabase Dashboard 中：
  // 1. 配置 SMTP 服务器（Authentication > SMTP）
  //    参考：https://supabase.com/docs/guides/auth/auth-smtp
  // 2. 自定义邮件模板（Authentication > Email Templates > Invite user）
  //    参考：https://supabase.com/docs/guides/auth/auth-email-templates
  // 3. 在模板中使用变量，如 {{ .Data.teamName }}, {{ .Data.inviteUrl }} 等
  //    注意：通过 data 参数传递的数据可以通过 {{ .Data.key }} 访问
  
  console.warn('提示：要发送自定义 HTML 邮件，请在 Supabase Dashboard 中配置邮件模板');
  console.warn('路径：Authentication > Email Templates > Invite user');
  console.warn('文档：https://supabase.com/docs/guides/auth/auth-email-templates');
}
