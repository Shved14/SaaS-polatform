import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";
import { ActivityService } from "@/lib/activity-service";

export const DELETE = createApiHandler(
  async (_req, context: { params: { boardId: string } }) => {
    const userId = await requireAuth();
    const boardId = context.params.boardId;

    console.log("DELETE board request:", { userId, boardId });

    // Get board with workspace to check ownership
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: true
      }
    });

    if (!board) {
      console.log("Board not found:", boardId);
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Check if user is the workspace owner
    if (board.workspace.ownerId !== userId) {
      console.log("Access denied - user not owner:", { userId, ownerId: board.workspace.ownerId });
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    console.log("Deleting board:", boardId);

    // Log activity before deletion
    await ActivityService.board.deleted(userId, boardId, board.name);

    // Delete the board (this will cascade delete tasks due to foreign key constraints)
    await prisma.board.delete({
      where: { id: boardId }
    });

    console.log("Board deleted successfully");
    return NextResponse.json({ success: true });
  }
);
