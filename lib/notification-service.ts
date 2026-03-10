import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/email";

type NotificationType = "TASK_CREATED" | "BOARD_INVITE" | "WORKSPACE_INVITE";

export interface NotificationPayload {
  [key: string]: unknown;
}

export const NotificationService = {
  async sendEmail(userId: string, subject: string, body: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    if (!user?.email || !resend) {
      return;
    }

    try {
      await resend.emails.send({
        from: "TaskFlow <notifications@taskflow.dev>",
        to: [user.email],
        subject,
        html: `<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.5;">${body}</div>`
      });
    } catch (e) {
      console.error("Failed to send email notification", e);
    }
  },

  // Заглушка для push-уведомлений — здесь можно интегрировать FCM, OneSignal и т.д.
  async sendPush(_userId: string, _message: string) {
    return;
  },

  async queueNotification(
    userId: string,
    type: NotificationType,
    data: NotificationPayload
  ) {
    await prisma.notification.create({
      data: {
        userId,
        type,
        data
      }
    });
  }
};

