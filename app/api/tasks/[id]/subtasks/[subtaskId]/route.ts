import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createApiHandler,
  parseJson,
  requireAuth
} from "@/lib/api";

const updateSubtaskSchema = z.object({
  completed: z.boolean()
});

export const PATCH = createApiHandler(
  async (req, context: { params: { id: string; subtaskId: string } }) => {
    const userId = await requireAuth();
    const taskId = context.params.id;
    const subtaskId = context.params.subtaskId;
    const body = await parseJson(req, updateSubtaskSchema);

    // Verify subtask exists and user has access
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: {
        task: {
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
        }
      }
    });

    if (!subtask || subtask.taskId !== taskId) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }

    const workspace = subtask.task.board.workspace;
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
    const updatedSubtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: { completed: body.completed }
    });

    // Create activity log
    await prisma.taskActivity.create({
      data: {
        taskId,
        userId,
        action: body.completed ? "SUBTASK_COMPLETED" : "SUBTASK_UNCOMPLETED",
        newValue: subtask.title,
      }
    });

    return NextResponse.json(updatedSubtask);
  }
);

export const DELETE = createApiHandler(
  async (_req, context: { params: { id: string; subtaskId: string } }) => {
    const userId = await requireAuth();
    const taskId = context.params.id;
    const subtaskId = context.params.subtaskId;

    // Verify subtask exists and user has access
    const subtask = await prisma.subtask.findUnique({
      where: { id: subtaskId },
      include: {
        task: {
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
        }
      }
    });

    if (!subtask || subtask.taskId !== taskId) {
      return NextResponse.json(
        { error: "Subtask not found" },
        { status: 404 }
      );
    }

    const workspace = subtask.task.board.workspace;
    const isMember =
      workspace.ownerId === userId ||
      workspace.members.some((m) => m.userId === userId);

    if (!isMember) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete subtask
    await prisma.subtask.delete({
      where: { id: subtaskId }
    });

    return NextResponse.json({ ok: true });
  }
);
