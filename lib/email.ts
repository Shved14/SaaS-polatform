import { Resend } from "resend";
import { env } from "@/lib/env";

const resendApiKey = env.RESEND_API_KEY;
const fromEmail = (
  env.RESEND_FROM ?? "TaskFlow <onboarding@resend.dev>"
).trim();

export const resend =
  resendApiKey && resendApiKey.length > 0
    ? new Resend(resendApiKey)
    : undefined;

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    return { ok: false, error: "Email not configured" };
  }
  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: "Код подтверждения email — TaskFlow",
      html: `
        <p>Ваш код подтверждения: <strong>${code}</strong></p>
        <p>Код действителен 15 минут. Никому не сообщайте код.</p>
      `
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Send failed";
    return { ok: false, error: message };
  }
}

interface WorkspaceInvitationEmailProps {
  to: string;
  workspaceName: string;
  inviterName: string;
  inviterEmail: string;
  invitationToken: string;
  workspaceId: string;
  isNewUser: boolean;
}

export async function sendWorkspaceInvitationEmail({
  to,
  workspaceName,
  inviterName,
  inviterEmail,
  invitationToken,
  workspaceId,
  isNewUser,
}: WorkspaceInvitationEmailProps): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.error('Resend not configured - missing RESEND_API_KEY');
    return { ok: false, error: "Email service not configured" };
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const invitationUrl = `${appUrl}/invite/${workspaceId}/${invitationToken}`;

  console.log('Email configuration:', {
    fromEmail,
    to,
    appUrl,
    invitationUrl,
    hasApiKey: !!resendApiKey,
    workspaceName,
    inviterName,
    isNewUser
  });

  const subject = `Вас пригласили присоединиться к рабочему пространству "${workspaceName}"`;

  const htmlContent = isNewUser ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workspace Invitation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>You're Invited! 🎉</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p><strong>${inviterName}</strong> (${inviterEmail}) has invited you to join the <strong>"${workspaceName}"</strong> workspace on their Kanban board.</p>
          
          <p>To get started, you'll need to create an account first:</p>
          
          <div style="text-align: center;">
            <a href="${invitationUrl}" class="button">Создать аккаунт и присоединиться к рабочему пространству</a>
          </div>
          
          <p>This invitation will expire in 7 days.</p>
          
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          
          <div class="footer">
            <p>Best regards,<br>The Kanban Team</p>
          </div>
        </div>
      </body>
    </html>
  ` : `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Workspace Invitation</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>You're Invited! 🎉</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p><strong>${inviterName}</strong> (${inviterEmail}) has invited you to join the <strong>"${workspaceName}"</strong> workspace on their Kanban board.</p>
          
          <p>You can accept this invitation by clicking the button below:</p>
          
          <div style="text-align: center;">
            <a href="${invitationUrl}" class="button">Accept Invitation</a>
          </div>
          
          <p>This invitation will expire in 7 days.</p>
          
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          
          <div class="footer">
            <p>Best regards,<br>The Kanban Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Email send error:', error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    console.error('Email service error:', error);
    const message = error instanceof Error ? error.message : "Send failed";
    return { ok: false, error: message };
  }
}

interface InvitationAcceptedEmailProps {
  to: string;
  workspaceName: string;
  newMemberName: string;
  newMemberEmail: string;
}

export async function sendInvitationAcceptedEmail({
  to,
  workspaceName,
  newMemberName,
  newMemberEmail,
}: InvitationAcceptedEmailProps): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    return { ok: false, error: "Email not configured" };
  }

  const subject = `${newMemberName} accepted your invitation to "${workspaceName}"`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation Accepted</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Invitation Accepted! ✅</h1>
        </div>
        <div class="content">
          <p>Great news!</p>
          <p><strong>${newMemberName}</strong> (${newMemberEmail}) has accepted your invitation to join the <strong>"${workspaceName}"</strong> workspace.</p>
          
          <p>You can now collaborate with them on your Kanban boards.</p>
          
          <div class="footer">
            <p>Best regards,<br>The Kanban Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error('Email send error:', error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    console.error('Email service error:', error);
    const message = error instanceof Error ? error.message : "Send failed";
    return { ok: false, error: message };
  }
}

