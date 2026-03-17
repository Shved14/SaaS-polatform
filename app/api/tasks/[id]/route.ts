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
  deadline: z.string().datetime().optional().nullable().refine((date) => {
    if (!date || date === "") return true; // Allow null or empty dates
    const deadlineDate = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for fair comparison
    return deadlineDate >= now;
  }, { message: "Deadline cannot be in the past" }),
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
        await ActivityService.task.updated(userId, taskId, task, { title: body.title });
      }
      data.title = sanitizeString(body.title, 200);
    }
    if (typeof body.description === "string" || body.description === null) {
      if (task.description !== body.description) {
        await ActivityService.task.updated(userId, taskId, task, { description: body.description });
      }
      data.description = sanitizeNullableString(body.description, 2000);
    }
    if (body.status && task.status !== body.status) {
      await ActivityService.task.updated(userId, taskId, task, { status: body.status });
      data.status = body.status;
    }
    if (body.priority && task.priority !== body.priority) {
      await ActivityService.task.updated(userId, taskId, task, { priority: body.priority });
      data.priority = body.priority;
    }
    if (typeof body.assigneeId === "string" || body.assigneeId === null) {
      if (task.assigneeId !== body.assigneeId) {
        await ActivityService.task.updated(userId, taskId, task, { assigneeId: body.assigneeId });

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

    void Promise.all(notifyPromises);

    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ ok: true });
  }
);

