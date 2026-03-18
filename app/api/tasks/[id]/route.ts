import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sanitizeNullableString, sanitizeString } from "@/lib/sanitize";
import {
  createApiHandler,
  parseJson,
  requireAuth
} from "@/lib/api";
import { NotificationService } from "@/lib/notification-service";
import { ActivityService } from "@/lib/activity-service";

const updateTaskSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  deadline: z.string().optional().nullable().refine((date) => {
    if (!date || date === "") return true;
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, { message: "Invalid date format" }),
  assigneeId: z.string().cuid().optional().nullable()
});

// Helper function to create activity log
async function createActivity(taskId: string, userId: string, action: any, oldValue?: string, newValue?: string) {
  await prisma.taskActivity.create({
    data: {
      taskId,
      userId,
      action,
      oldValue,
      newValue,
    }
  });
}

export const GET = createApiHandler(
  async (_req, context: { params: { id: string } }) => {
    const userId = await requireAuth();
    const taskId = context.params.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
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

    // Get board and workspace info for permission check
    const board = await prisma.board.findUnique({
      where: { id: task.boardId },
      include: {
        workspace: {
          include: {
            members: true
          }
        }
      }
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    const workspace = board.workspace;
    const isMember =
      workspace.ownerId === userId ||
      workspace.members.some((m) => m.userId === userId);

    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(task);
  }
);

export const PATCH = createApiHandler(
  async (req, context: { params: { id: string } }) => {
    const userId = await requireAuth();

    const taskId = context.params.id;
    const body = await parseJson(req, updateTaskSchema);

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
        { error: "Задача не найдена" },
        { status: 404 }
      );
    }

    const workspace = task.board.workspace;
    const isMember =
      workspace.ownerId === userId ||
      workspace.members.some((m) => m.userId === userId);

    if (!isMember) {
      return NextResponse.json(
        { error: "Нет доступа к этой задаче" },
        { status: 403 }
      );
    }

    const data: Record<string, unknown> = {};

    if (typeof body.title === "string") {
      if (task.title !== body.title) {
        try { await ActivityService.task.updated(userId, taskId, task, { title: body.title }); } catch (e) { console.error("Activity log error:", e); }
      }
      data.title = sanitizeString(body.title, 200);
    }
    if (typeof body.description === "string" || body.description === null) {
      if (task.description !== body.description) {
        try { await ActivityService.task.updated(userId, taskId, task, { description: body.description }); } catch (e) { console.error("Activity log error:", e); }
      }
      data.description = sanitizeNullableString(body.description, 2000);
    }
    if (body.status && task.status !== body.status) {
      try {
        await ActivityService.task.statusChanged(userId, taskId, task.status, body.status, task.title);
      } catch (e) { console.error("Activity log error:", e); }
      data.status = body.status;
    }
    if (body.priority && task.priority !== body.priority) {
      try { await ActivityService.task.updated(userId, taskId, task, { priority: body.priority }); } catch (e) { console.error("Activity log error:", e); }
      data.priority = body.priority;
    }
    if (typeof body.assigneeId === "string" || body.assigneeId === null) {
      if (task.assigneeId !== body.assigneeId) {
        try { await ActivityService.task.updated(userId, taskId, task, { assigneeId: body.assigneeId }); } catch (e) { console.error("Activity log error:", e); }

        // Создаем уведомление для нового исполнителя
        if (body.assigneeId && body.assigneeId !== userId) {
          try {
            await NotificationService.events.taskAssigned(
              body.assigneeId,
              task.title,
              task.board.name,
              task.board.workspace.name,
              taskId,
              task.boardId,
              task.board.workspaceId
            );
          } catch (notificationError) {
            console.error("Failed to create task assignment notification:", notificationError);
          }
        }
      }
      data.assigneeId = body.assigneeId;
    }
    if (typeof body.deadline === "string") {
      const newDeadline = body.deadline ? new Date(body.deadline).toISOString() : null;
      const oldDeadline = task.deadline ? task.deadline.toISOString() : null;
      if (oldDeadline !== newDeadline) {
        await createActivity(taskId, userId, "DEADLINE_CHANGED", oldDeadline || undefined, newDeadline || undefined);
      }
      data.deadline = body.deadline ? new Date(body.deadline) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(task);
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Send Slack notification for task update
    try {
      const changes: string[] = [];
      if (data.title) changes.push(`название: «${data.title}»`);
      if (data.status) changes.push(`статус: ${data.status}`);
      if (data.priority) changes.push(`приоритет: ${data.priority}`);
      if (data.assigneeId !== undefined) changes.push(`исполнитель изменён`);
      if (changes.length > 0) {
        const taskUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/app/board/${task.boardId}?task=${taskId}`;
        await NotificationService.sendSlackWebhook(
          task.board.workspaceId,
          `✏️ Задача «${task.title}» обновлена: ${changes.join(", ")}`,
          taskUrl
        );
      }
    } catch (slackError) {
      console.error("Failed to send Slack notification:", slackError);
    }

    return NextResponse.json(updatedTask);
  }
);

export const DELETE = createApiHandler(
  async (_req, context: { params: { id: string } }) => {
    const userId = await requireAuth();
    const taskId = context.params.id;

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
        { error: "Задача не найдена" },
        { status: 404 }
      );
    }

    const workspace = task.board.workspace;
    const isMember =
      workspace.ownerId === userId ||
      workspace.members.some((m) => m.userId === userId);

    if (!isMember) {
      return NextResponse.json(
        { error: "Нет доступа к этой задаче" },
        { status: 403 }
      );
    }

    // Создаём уведомления для участников workspace (кроме автора)
    const recipientIds = new Set<string>();
    recipientIds.add(workspace.ownerId);
    for (const m of workspace.members) {
      recipientIds.add(m.userId);
    }
    recipientIds.delete(userId);

    const notifyPromises = Array.from(recipientIds).map((uid) =>
      NotificationService.queueNotification(uid, "TASK_DELETED", {
        boardId: task.boardId,
        boardName: task.board.name,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        taskId: task.id,
        title: task.title,
        deletedBy: userId
      })
    );

    void Promise.all(notifyPromises).catch(err => console.error("Notification queue error:", err));

    // Send Slack notification for task deletion
    try {
      await NotificationService.sendSlackWebhook(
        workspace.id,
        `🗑️ Задача «${task.title}» удалена с доски «${task.board.name}»`
      );
    } catch (slackError) {
      console.error("Failed to send Slack notification:", slackError);
    }

    // Log activity before deletion
    console.log("Logging task deletion activity");
    try {
      await ActivityService.logActivity(userId, "deleted_task", taskId, "task", {
        newValue: { title: task.title }
      });
    } catch (activityError) {
      console.error("Failed to log task deletion activity:", activityError);
    }

    await prisma.task.delete({
      where: { id: taskId }
    });

    console.log("Task deleted successfully");
    return NextResponse.json({ ok: true });
  }
);

