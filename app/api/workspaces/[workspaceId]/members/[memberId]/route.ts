import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

export const DELETE = createApiHandler(
  async (_req, context: { params: { workspaceId: string; memberId: string } }) => {
    const userId = await requireAuth();
    const { workspaceId, memberId } = context.params;

    // Get workspace with members
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: { name: true, email: true },
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

    // Check if user is workspace owner
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

    // Check if owner is trying to remove themselves
    if (member.userId === workspace.ownerId) {
      // Get other members to transfer ownership
      const otherMembers = workspace.members.filter(m => m.userId !== workspace.ownerId);

      if (otherMembers.length === 0) {
        // Last member - delete the workspace
        await prisma.workspace.delete({
          where: { id: workspaceId }
        });

        return NextResponse.json({
          success: true,
          deleted: true,
          message: "Workspace deleted as you were the last member",
        });
      } else {
        // Transfer ownership to the next member
        const newOwner = otherMembers[0];

        // Update workspace owner
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: { ownerId: newOwner.userId }
        });

        // Remove old owner from members
        await prisma.workspaceMember.delete({
          where: { id: memberId }
        });

        // Create notification for new owner
        await prisma.notification.create({
          data: {
            userId: newOwner.userId,
            type: "WORKSPACE_OWNERSHIP_TRANSFER",
            data: {
              workspaceId: workspaceId,
              workspaceName: workspace.name,
              message: `You are now the owner of workspace "${workspace.name}"`,
            },
            isRead: false,
          },
        });

        return NextResponse.json({
          success: true,
          transferred: true,
          newOwnerId: newOwner.userId,
          message: "Ownership transferred and you left the workspace",
        });
      }
    }

    // Regular member removal
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
