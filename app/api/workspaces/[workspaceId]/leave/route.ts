import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

export const DELETE = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const { workspaceId } = await req.json();

  if (!workspaceId) {
    return NextResponse.json(
      { error: "Workspace ID is required" },
      { status: 400 }
    );
  }

  // Check if user is a member of the workspace
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    include: {
      workspace: {
        select: {
          ownerId: true,
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "You are not a member of this workspace" },
      { status: 404 }
    );
  }

  // Check if user is the owner
  if (membership.workspace.ownerId === userId) {
    return NextResponse.json(
      { error: "Workspace owners cannot leave their own workspace. Transfer ownership or delete the workspace first." },
      { status: 400 }
    );
  }

  // Remove the user from the workspace
  await prisma.workspaceMember.delete({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
  });

  return NextResponse.json({ success: true });
});
