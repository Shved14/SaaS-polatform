import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";
import { z } from "zod";
import { NotificationService } from "@/lib/notification-service";

const inviteSchema = z.object({
  userId: z.string().cuid()
});

export const POST = createApiHandler(
  async (req, context: { params: { boardId: string } }) => {
    const currentUserId = await requireAuth();
    const boardId = context.params.boardId;

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          include: {
            members: true
          }
        }
      }
    });

    if (!board) {
      return NextResponse.json(
        { error: "Доска не найдена" },
        { status: 404 }
      );
    }

    const isOwner =
      board.workspace.ownerId === currentUserId ||
      board.workspace.members.some(
        (m) => m.userId === currentUserId && m.role === "OWNER"
      );

    if (!isOwner) {
      return NextResponse.json(
        { error: "Только владелец workspace может приглашать на доску" },
        { status: 403 }
      );
    }

    const body = await parseJson(req, inviteSchema);

    // Создаём уведомление-приглашение
    await NotificationService.queueNotification(body.userId, "BOARD_INVITE", {
      boardId: board.id,
      boardName: board.name,
      workspaceId: board.workspaceId,
      workspaceName: board.workspace.name,
      invitedBy: currentUserId
    });

    return NextResponse.json({ ok: true });
  }
);

