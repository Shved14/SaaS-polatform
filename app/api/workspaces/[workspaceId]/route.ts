import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";
import { sanitizeString } from "@/lib/sanitize";
import { ActivityService } from "@/lib/activity-service";

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

// GET workspace details
export const GET = createApiHandler(
  async (_req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const isOwner =
      workspace.ownerId === userId ||
      workspace.members.some((m) => m.userId === userId);

    if (!isOwner) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json(workspace);
  }
);

// UPDATE workspace
export const PATCH = createApiHandler(
  async (req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (workspace.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only workspace owners can update workspace settings" },
        { status: 403 }
      );
    }

    const body = await parseJson(req, updateWorkspaceSchema);

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: sanitizeString(body.name, 100),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedWorkspace);
  }
);

export const DELETE = createApiHandler(
  async (_req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;

    console.log("DELETE workspace request:", { userId, workspaceId });

    // Get workspace to check ownership and log activity
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        ownerId: true,
        name: true
      }
    });

    if (!workspace) {
      console.log("Workspace not found:", workspaceId);
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if user is the workspace owner
    if (workspace.ownerId !== userId) {
      console.log("Access denied - user not owner:", { userId, ownerId: workspace.ownerId });
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    console.log("Deleting workspace:", workspaceId);

    try {
      // Log activity before deletion
      await ActivityService.workspace.userLeft(userId, workspaceId, workspace.name);
    } catch (activityError) {
      console.error("Failed to log workspace deletion activity:", activityError);
      // Продолжаем удаление даже если логирование не сработало
    }

    // Delete the workspace (this will cascade delete boards and tasks due to foreign key constraints)
    await prisma.workspace.delete({
      where: { id: workspaceId }
    });

    console.log("Workspace deleted successfully");
    return NextResponse.json({ success: true });
  }
);
