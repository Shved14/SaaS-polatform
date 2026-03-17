import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/email";

export type NotificationType =
  | "WORKSPACE_INVITATION"
  | "BOARD_INVITE"
  | "TASK_ASSIGNED"
  | "TASK_COMMENT_ADDED"
  | "TASK_DEADLINE_TODAY"
  | "TASK_OVERDUE"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_STATUS_CHANGED"
  | "TASK_DELETED";

export interface NotificationPayload {
  [key: string]: unknown;
}

export interface NotificationData {
  title: string;
  message: string;
  data?: any;
}

export const NotificationService = {
  async sendSlackWebhook(workspaceId: string, message: string, taskUrl?: string) {
    try {
      // Получаем интеграции Slack для workspace
      const integrations = await prisma.workspaceIntegration.findMany({
        where: {
          workspaceId,
          type: "slack",
          isActive: true
        }
      });

      // Отправляем webhook на все активные Slack интеграции
      const webhookPromises = integrations.map(async (integration) => {
        const slackMessage = {
          text: message,
          username: "TaskFlow",
          icon_emoji: ":robot_face:"
        };

        // Добавляем кнопку, если есть ссылка на задачу
        if (taskUrl) {
          slackMessage.attachments = [{
            text: "Открыть задачу",
            actions: [{
              type: "button",
              text: "Открыть",
              url: taskUrl
            }]
          }];
        }

        const response = await fetch(integration.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(slackMessage)
        });

        if (!response.ok) {
          console.error(`Slack webhook failed for ${integration.id}:`, response.status, await response.text());
        }

        return response.ok;
      });

      const results = await Promise.allSettled(webhookPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;

      console.log(`Slack webhook sent to ${successful}/${integrations.length} integrations`);
      return successful > 0;
    } catch (error) {
      console.error("Error sending Slack webhook:", error);
      return false;
    }
  },

  async getUserSettings(userId: string) {
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });

    // Создаем настройки по умолчанию если их нет
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { userId }
      });
    }

    return settings;
  },

  async shouldCreateNotification(userId: string, type: NotificationType): Promise<boolean> {
    const settings = await this.getUserSettings(userId);

    switch (type) {
      case "WORKSPACE_INVITATION":
        return settings.workspaceInvitations;
      case "TASK_ASSIGNED":
        return settings.taskAssigned;
      case "TASK_COMMENT_ADDED":
        return settings.taskComments;
      case "TASK_DEADLINE_TODAY":
      case "TASK_OVERDUE":
        return settings.taskDeadlines;
      default:
        return true;
    }
  },

  async sendEmail(userId: string, subject: string, body: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });

    const settings = await this.getUserSettings(userId);
    if (!user?.email || !resend || !settings.emailNotifications) {
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

  async sendPush(_userId: string, _message: string) {
    // Заглушка для push-уведомлений
    return;
  },

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ) {
    const shouldCreate = await this.shouldCreateNotification(userId, type);
    if (!shouldCreate) return;

    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || null,
        isRead: false
      }
    });
  },

  async queueNotification(
    userId: string,
    type: NotificationType,
    data: any
  ) {
    // Создаем уведомление на основе типа и данных
    switch (type) {
      case "TASK_CREATED":
        await this.events.taskCreated(
          userId,
          data.title,
          data.createdByName || "Кто-то",
          data.boardName,
          data.workspaceName,
          data.taskId,
          data.boardId,
          data.workspaceId
        );
        break;
      case "TASK_DELETED":
        // Создаем уведомление об удалении задачи
        await this.createNotification(
          userId,
          "TASK_DELETED",
          "Задача удалена",
          `Задача «${data.title}» была удалена`,
          {
            type: "task_deleted",
            taskId: data.taskId,
            boardId: data.boardId,
            workspaceId: data.workspaceId,
            taskTitle: data.title,
            boardName: data.boardName,
            workspaceName: data.workspaceName
          }
        );
        break;
      default:
        console.warn(`Unknown notification type: ${type}`);
    }
  },

  // События системы
  events: {
    async workspaceInvitation(userId: string, workspaceName: string, inviterName: string, invitationToken: string) {
      const title = "Приглашение в workspace";
      const message = `${inviterName} пригласил вас присоединиться к workspace «${workspaceName}»`;

      await NotificationService.createNotification(
        userId,
        "WORKSPACE_INVITATION",
        title,
        message,
        {
          type: "workspace_invitation",
          workspaceName,
          inviterName,
          invitationToken
        }
      );
    },

    async taskAssigned(userId: string, taskTitle: string, boardName: string, workspaceName: string, taskId: string, boardId: string, workspaceId: string) {
      const title = "Новая задача";
      const message = `Вам назначена задача «${taskTitle}» на доске «${boardName}»`;
      const taskUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/app/workspace/${workspaceId}/board/${boardId}?task=${taskId}`;

      await NotificationService.createNotification(
        userId,
        "TASK_ASSIGNED",
        title,
        message,
        {
          type: "task_assigned",
          taskId,
          boardId,
          workspaceId,
          taskTitle,
          boardName,
          workspaceName
        }
      );

      // Отправляем в Slack
      await NotificationService.sendSlackWebhook(workspaceId, `📋 *${title}*\n\n${message}\n\n🔗 [Открыть задачу](${taskUrl})`, taskUrl);
    },

    async taskCommentAdded(userId: string, taskTitle: string, commenterName: string, boardName: string, workspaceName: string, taskId: string, boardId: string, workspaceId: string) {
      const title = "Новый комментарий";
      const message = `${commenterName} прокомментировал задачу «${taskTitle}»`;

      await NotificationService.createNotification(
        userId,
        "TASK_COMMENT_ADDED",
        title,
        message,
        {
          type: "task_comment",
          taskId,
          boardId,
          workspaceId,
          taskTitle,
          boardName,
          workspaceName,
          commenterName
        }
      );
    },

    async taskDeadlineToday(userId: string, taskTitle: string, boardName: string, workspaceName: string, taskId: string, boardId: string, workspaceId: string) {
      const title = "Срок выполнения задачи сегодня";
      const message = `Задача «${taskTitle}» должна быть выполнена сегодня`;

      await NotificationService.createNotification(
        userId,
        "TASK_DEADLINE_TODAY",
        title,
        message,
        {
          type: "task_deadline_today",
          taskId,
          boardId,
          workspaceId,
          taskTitle,
          boardName,
          workspaceName
        }
      );
    },

    async taskOverdue(userId: string, taskTitle: string, boardName: string, workspaceName: string, taskId: string, boardId: string, workspaceId: string) {
      const title = "Просроченная задача";
      const message = `Задача «${taskTitle}» просрочена`;

      await NotificationService.createNotification(
        userId,
        "TASK_OVERDUE",
        title,
        message,
        {
          type: "task_overdue",
          taskId,
          boardId,
          workspaceId,
          taskTitle,
          boardName,
          workspaceName
        }
      );
    },

    async taskCreated(userId: string, taskTitle: string, creatorName: string, boardName: string, workspaceName: string, taskId: string, boardId: string, workspaceId: string) {
      const title = "Новая задача в команде";
      const message = `${creatorName} создал задачу «${taskTitle}» на доске «${boardName}»`;

      await NotificationService.createNotification(
        userId,
        "TASK_CREATED",
        title,
        message,
        {
          type: "task_created",
          taskId,
          boardId,
          workspaceId,
          taskTitle,
          boardName,
          workspaceName,
          creatorName
        }
      );
    }
  }
};

