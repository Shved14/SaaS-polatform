import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

export const DELETE = createApiHandler(
  async (_req, context: { params: { workspaceId: string; memberId: string } }) => {
    const userId = await requireAuth();
    const { workspaceId, memberId } = context.params;

    // Check if user is workspace owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true, name: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (workspace.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only workspace owners can remove members" },
        { status: 403 }
      );
    }

    // Get member info before deletion
    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Don't allow owner to remove themselves
    if (member.userId === workspace.ownerId) {
      return NextResponse.json(
        { error: "Cannot remove workspace owner" },
        { status: 400 }
      );
    }

    try {
      // Create notification before removing
      await prisma.notification.create({
        data: {
          userId: member.userId,
          type: "WORKSPACE_REMOVAL",
          data: {
            workspaceId: workspaceId,
            workspaceName: workspace.name,
            message: `You have been removed from workspace "${workspace.name}"`,
          },
          isRead: false,
        },
      });

      // Remove member
      await prisma.workspaceMember.delete({
        where: {
          id: memberId,
          workspaceId: workspaceId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Member removed successfully",
      });
    } catch (error) {
      console.error("Error removing member:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
