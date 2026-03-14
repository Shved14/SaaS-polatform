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
        { error: "Only workspace owners can remove members" },
        { status: 403 }
      );
    }

    // Remove the member
    await prisma.workspaceMember.delete({
      where: {
        id: memberId,
        workspaceId: workspaceId,
      },
    });

    return NextResponse.json({ success: true });
  }
);
