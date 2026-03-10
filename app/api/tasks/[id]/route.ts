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
  deadline: z.string().datetime().optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable()
});

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

    const data: any = {};

    if (typeof body.title === "string") {
      data.title = sanitizeString(body.title, 200);
    }
    if (typeof body.description === "string" || body.description === null) {
      data.description = sanitizeNullableString(body.description, 2000);
    }
    if (body.status) {
      data.status = body.status;
    }
    if (body.priority) {
      data.priority = body.priority;
    }
    if (typeof body.assigneeId === "string" || body.assigneeId === null) {
      data.assigneeId = body.assigneeId;
    }
    if (typeof body.deadline === "string") {
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

    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ ok: true });
  }
);

