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

