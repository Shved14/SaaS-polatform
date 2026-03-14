import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/sanitize";
import {
  createApiHandler,
  parseJson,
  requireAuth
} from "@/lib/api";

const createSubtaskSchema = z.object({
  title: z.string().min(1).max(200)
});

export const POST = createApiHandler(
  async (req, context: { params: { id: string } }) => {
    const userId = await requireAuth();
    const taskId = context.params.id;
    const body = await parseJson(req, createSubtaskSchema);

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

    // Create subtask
    const subtask = await prisma.subtask.create({
      data: {
        title: sanitizeString(body.title, 200),
        taskId,
      }
    });

    // Create activity log
    await prisma.taskActivity.create({
      data: {
        taskId,
        userId,
        action: "SUBTASK_ADDED",
        newValue: subtask.title,
      }
    });

    return NextResponse.json(subtask);
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

    // Get subtasks
    const subtasks = await prisma.subtask.findMany({
      where: { taskId },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(subtasks);
  }
);

const updateSubtaskSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(1).max(200).optional()
});

export const PATCH = createApiHandler(
  async (req, context: { params: { id: string, subtaskId: string } }) => {
    const userId = await requireAuth();
    const taskId = context.params.id;
    const subtaskId = context.params.subtaskId;
    const body = await parseJson(req, updateSubtaskSchema);

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

    // Update subtask
    const subtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: body
    });

    // Create activity log
    await prisma.taskActivity.create({
      data: {
        taskId,
        userId,
        action: body.completed ? "SUBTASK_ADDED" : "SUBTASK_ADDED",
        newValue: subtask.title,
      }
    });

    return NextResponse.json(subtask);
  }
);

export const DELETE = createApiHandler(
  async (req, context: { params: { id: string, subtaskId: string } }) => {
    const userId = await requireAuth();
    const taskId = context.params.id;
    const subtaskId = context.params.subtaskId;

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

    // Get subtask for activity log
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId }
    });

    if (!subtask) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }

    // Delete subtask
    await prisma.subtask.delete({
      where: { id: subtaskId }
    });

    // Create activity log
    await prisma.taskActivity.create({
      data: {
        taskId,
        userId,
        action: "SUBTASK_ADDED",
        newValue: subtask.title,
      }
    });

    return NextResponse.json({ success: true });
  }
);
