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
