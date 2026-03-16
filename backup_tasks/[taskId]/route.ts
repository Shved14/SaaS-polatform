import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sanitizeNullableString, sanitizeString } from "@/lib/sanitize";
import {
  createApiHandler,
  parseJson,
  requireAuth
} from "@/lib/api";

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

const updateTaskSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  deadline: z.string().datetime().optional().nullable().refine((date) => {
    if (!date) return true; // Allow null dates
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
  async (_req, context: { params: { taskId: string } }) => {
    const userId = await requireAuth();
    const taskId = context.params.taskId;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        taskComments: {
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
        },
        taskSubtasks: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        taskActivities: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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
      workspace.members.some((m: any) => m.userId === userId);

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
  async (req, context: { params: { taskId: string } }) => {
    const userId = await requireAuth();

    const taskId = context.params.taskId;
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

    const data: any = {};

    if (typeof body.title === "string") {
      if (task.title !== body.title) {
        await createActivity(taskId, userId, "UPDATED", task.title, body.title);
      }
      data.title = sanitizeString(body.title, 200);
    }
    if (typeof body.description === "string" || body.description === null) {
      if (task.description !== body.description) {
        await createActivity(taskId, userId, "UPDATED", task.description || undefined, body.description || undefined);
      }
      data.description = sanitizeNullableString(body.description, 2000);
    }
    if (body.status && task.status !== body.status) {
      await createActivity(taskId, userId, "STATUS_CHANGED", task.status, body.status);
      data.status = body.status;
    }
    if (body.priority && task.priority !== body.priority) {
      await createActivity(taskId, userId, "PRIORITY_CHANGED", task.priority, body.priority);
      data.priority = body.priority;
    }
    if (typeof body.assigneeId === "string" || body.assigneeId === null) {
      if (task.assigneeId !== body.assigneeId) {
        await createActivity(taskId, userId, "ASSIGNEE_CHANGED", task.assigneeId || undefined, body.assigneeId || undefined);
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
      return NextResponse.json({ ok: true });
    }

    await prisma.task.update({
      where: { id: taskId },
      data
    });

    return NextResponse.json({ ok: true });
  }
);

export const DELETE = createApiHandler(
  async (_req, context: { params: { taskId: string } }) => {
    const userId = await requireAuth();
    const taskId = context.params.taskId;

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

    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ ok: true });
  }
);

