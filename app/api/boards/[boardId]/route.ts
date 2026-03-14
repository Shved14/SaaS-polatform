import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

export const DELETE = createApiHandler(
  async (_req, context: { params: { boardId: string } }) => {
    const userId = await requireAuth();
    const boardId = context.params.boardId;

    // Get board with workspace to check ownership
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: true
      }
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404 }
      );
    }

    // Check if user is the workspace owner
    if (board.workspace.ownerId !== userId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Delete the board (this will cascade delete tasks due to foreign key constraints)
    await prisma.board.delete({
      where: { id: boardId }
    });

    return NextResponse.json({ success: true });
  }
);
