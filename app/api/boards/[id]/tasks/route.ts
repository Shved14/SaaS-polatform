import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  assigneeId: z.string().cuid().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  deadline: z.string().datetime().optional().nullable(),
});

export const GET = createApiHandler(async (req, context) => {
  const userId = await requireAuth();
  const boardId = context.params.id;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!board) {
    return NextResponse.json(
      { error: "Доска не найдена" },
      { status: 404 }
    );
  }

  const workspace = board.workspace;
  const isMember =
    workspace.ownerId === userId ||
    workspace.members.some((m) => m.userId === userId);

  if (!isMember) {
    return NextResponse.json(
      { error: "Нет доступа к этой доске" },
      { status: 403 }
    );
  }

  const tasks = await prisma.task.findMany({
    where: { boardId },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(tasks);
});

export const POST = createApiHandler(async (req, context) => {
  const userId = await requireAuth();
  const boardId = context.params.id;
  const body = await parseJson(req, createTaskSchema);

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: {
        include: {
          members: true,
        },
      },
    },
  });

  if (!board) {
    return NextResponse.json(
      { error: "Доска не найдена" },
      { status: 404 }
    );
  }

  const workspace = board.workspace;
  const isMember =
    workspace.ownerId === userId ||
    workspace.members.some((m) => m.userId === userId);

  if (!isMember) {
    return NextResponse.json(
      { error: "Нет доступа к этой доске" },
      { status: 403 }
    );
  }

  // Validate deadline
  if (body.deadline) {
    const deadlineDate = new Date(body.deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day for fair comparison
    if (deadlineDate < now) {
      return NextResponse.json(
        { error: "Deadline cannot be in the past" },
        { status: 400 }
      );
    }
  }

  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description,
      boardId,
      assigneeId: body.assigneeId,
      priority: body.priority,
      deadline: body.deadline ? new Date(body.deadline) : null,
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Create activity log
  await prisma.taskActivity.create({
    data: {
      taskId: task.id,
      userId,
      action: "CREATED",
    },
  });

  return NextResponse.json(task);
});
