import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

export const dynamic = 'force-dynamic';

// GET /api/workspaces/[workspaceId]/invitations — список приглашений
export const GET = createApiHandler(
  async (_req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const { workspaceId } = context.params;

    // Проверяем доступ
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace не найден" }, { status: 404 });
    }

    const hasAccess =
      workspace.ownerId === userId ||
      workspace.members.some((m) => m.userId === userId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    // Обновляем просроченные приглашения
    await prisma.workspaceInvitation.updateMany({
      where: {
        workspaceId,
        status: "pending",
        expiresAt: { lt: new Date() }
      },
      data: { status: "expired" }
    });

    const invitations = await prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      include: {
        inviter: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(
      invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        token: inv.token,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        inviter: inv.inviter
      }))
    );
  }
);

// DELETE /api/workspaces/[workspaceId]/invitations — отменить приглашение
export const DELETE = createApiHandler(
  async (req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const { workspaceId } = context.params;
    const { token } = await req.json();

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace || workspace.ownerId !== userId) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
    }

    const invitation = await prisma.workspaceInvitation.findFirst({
      where: { workspaceId, token }
    });

    if (!invitation) {
      return NextResponse.json({ error: "Приглашение не найдено" }, { status: 404 });
    }

    await prisma.workspaceInvitation.delete({
      where: { id: invitation.id }
    });

    return NextResponse.json({ success: true });
  }
);
