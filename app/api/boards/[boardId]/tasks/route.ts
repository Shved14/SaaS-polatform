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

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(2000).optional(),
  assigneeId: z
    .union([z.string().cuid(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v)),
  deadline: z
    .union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.literal(""),
      z.null()
    ])
    .optional()
    .transform((v) => (v === "" || v == null ? null : v))
    .refine((date) => {
      if (!date) return true; // Allow null dates
      const deadlineDate = new Date(date);
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Set to start of day for fair comparison
      return deadlineDate >= now;
    }, { message: "Deadline cannot be in the past" }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional()
});

export const POST = createApiHandler(
  async (req, context: { params: { boardId: string } }) => {
    const userId = await requireAuth();
    const boardId = context.params.boardId;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
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
        { error: "Доска не найдена" },
        { status: 404 }
      );
    }

    const isMember =
      board.workspace.ownerId === userId ||
      board.workspace.members.some((m) => m.userId === userId);

    if (!isMember) {
      return NextResponse.json(
        { error: "Нет доступа к этой доске" },
        { status: 403 }
      );
    }

    const body = await parseJson(req, createTaskSchema);

    const title = sanitizeString(body.title, 200);
    const description = sanitizeNullableString(body.description, 2000);
    const deadline =
      body.deadline != null && body.deadline !== ""
        ? new Date(body.deadline)
        : null;
    const priority: TaskPriority = body.priority ?? "MEDIUM";

    const created = await prisma.task.create({
      data: {
        title,
        description,
        status: "TODO",
        priority,
        deadline,
        assigneeId: body.assigneeId ?? null,
        boardId
      },
      include: {
        assignee: true
      }
    });

    // Fetch creator name for notifications
    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true }
    });
    const creatorName = creator?.name || creator?.email || "Кто-то";

    // Log activity
    try {
      await ActivityService.task.created(userId, created.id, created.title);
    } catch (activityError) {
      console.error("Failed to log task creation activity:", activityError);
    }

    // Send Slack notification
    try {
      const taskUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/app/board/${boardId}?task=${created.id}`;
      await NotificationService.sendSlackWebhook(
        board.workspaceId,
        `✅ Создана новая задача «${created.title}» на доске «${board.name}»`,
        taskUrl
      );
    } catch (slackError) {
      console.error("Failed to send Slack notification:", slackError);
    }

    // Создаём уведомления для участников workspace (кроме автора)
    const recipientIds = new Set<string>();
    recipientIds.add(board.workspace.ownerId);
    for (const m of board.workspace.members) {
      recipientIds.add(m.userId);
    }
    recipientIds.delete(userId);

    const notifyPromises = Array.from(recipientIds).map((uid) =>
      NotificationService.queueNotification(uid, "TASK_CREATED", {
        boardId,
        boardName: board.name,
        workspaceId: board.workspaceId,
        workspaceName: board.workspace.name,
        taskId: created.id,
        title: created.title,
        priority: created.priority,
        deadline: created.deadline
          ? created.deadline.toISOString()
          : null,
        createdBy: userId,
        createdByName: creatorName
      })
    );

    void Promise.all(notifyPromises);

    return NextResponse.json({
      id: created.id,
      title: created.title,
      status: created.status as TaskStatus,
      priority: created.priority as TaskPriority,
      deadline: created.deadline
        ? created.deadline.toISOString()
        : null,
      assigneeId: created.assigneeId,
      assigneeName:
        created.assignee?.name ||
        created.assignee?.email ||
        created.assigneeId ||
        null
    });
  }
);

