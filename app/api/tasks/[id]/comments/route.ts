import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/sanitize";
import {
  createApiHandler,
  parseJson,
  requireAuth
} from "@/lib/api";
import { NotificationService } from "@/lib/notification-service";
import { ActivityService } from "@/lib/activity-service";

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000)
});

export const POST = createApiHandler(
  async (req, context: { params: { id: string } }) => {
    const userId = await requireAuth();
    const taskId = context.params.id;
    const body = await parseJson(req, createCommentSchema);

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        board: {
          include: {
            workspace: {
              include: {
                members: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const workspace = task.board.workspace;
    const isMember =
      workspace.ownerId === userId ||
      workspace.members.some((m) => m.userId === userId);

    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Create comment
    const comment = await prisma.taskComment.create({
      data: {
        content: sanitizeString(body.content, 2000),
        taskId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create activity log
    try {
      await prisma.taskActivity.create({
        data: {
          taskId,
          userId,
          action: "COMMENT_ADDED",
          newValue: comment.content,
        }
      });
      await ActivityService.comment.added(userId, taskId, task.title, comment.content);
    } catch (activityError) {
      console.error("Failed to log comment activity:", activityError);
    }

    // Send Slack notification for comment
    try {
      const commenterForSlack = comment.author.name || comment.author.email || "Кто-то";
      const taskUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/app/board/${task.boardId}?task=${taskId}`;
      await NotificationService.sendSlackWebhook(
        workspace.id,
        `💬 ${commenterForSlack} прокомментировал задачу «${task.title}»`,
        taskUrl
      );
    } catch (slackError) {
      console.error("Failed to send Slack notification:", slackError);
    }

    // Создаём уведомления для участников workspace (кроме автора комментария)
    const recipientIds = new Set<string>();
    recipientIds.add(workspace.ownerId);
    for (const m of workspace.members) {
      recipientIds.add(m.userId);
    }
    recipientIds.delete(userId); // Исключаем автора комментария

    // Добавляем назначенного пользователя, если он есть
    if (task.assigneeId) {
      recipientIds.add(task.assigneeId);
    }

    const commenterName = comment.author.name || comment.author.email || "Кто-то";

    const notifyPromises = Array.from(recipientIds).map((uid) =>
      NotificationService.events.taskCommentAdded(
        uid,
        task.title,
        commenterName,
        task.board.name,
        workspace.name,
        taskId,
        task.boardId,
        workspace.id
      )
    );

    void Promise.all(notifyPromises).catch(err => console.error("Notification error:", err));

    return NextResponse.json(comment);
  }
);

export const GET = createApiHandler(
  async (req, context: { params: { id: string } }) => {
    const userId = await requireAuth();
    const taskId = context.params.id;

    // Verify task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        board: {
          include: {
            workspace: {
              include: {
                members: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const workspace = task.board.workspace;
    const isMember =
      workspace.ownerId === userId ||
      workspace.members.some((m) => m.userId === userId);

    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get comments
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(comments);
  }
);
