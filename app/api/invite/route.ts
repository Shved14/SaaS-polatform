import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";
import { InvitationService } from "@/lib/invitation-service";

const inviteSchema = z.object({
  email: z.string().email("Введите корректный email"),
  workspaceId: z.string().min(1, "ID workspace обязателен")
});

// POST /api/invite - создать приглашение
export async function POST(req: Request) {
  try {
    const { email, workspaceId } = inviteSchema.parse(await req.json());
    const inviterId = await requireAuth();

    // Проверяем существование workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace не найден" },
        { status: 404 }
      );
    }

    // Проверяем, является ли пользователь владельцем
    if (workspace.ownerId !== inviterId) {
      return NextResponse.json(
        { error: "Только владелец может приглашать пользователей" },
        { status: 403 }
      );
    }

    // Проверяем, существует ли уже приглашение
    const existingInvitation = await prisma.workspaceInvitation.findFirst({
      where: {
        email,
        workspaceId,
        status: "pending"
      }
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Приглашение для этого email уже отправлено" },
        { status: 409 }
      );
    }

    // Создаем приглашение
    const invitation = await InvitationService.createInvitation(
      workspaceId,
      email,
      inviterId
    );

    return NextResponse.json({
      success: true,
      invitationId: invitation.id,
      message: "Приглашение отправлено на указанный email"
    });
  } catch (error: any) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }
}

// GET /api/invite/{token} - получить информацию о приглашении
export async function GET(req: Request, context: { params: { token: string } }) {
  const { token } = context.params;

  try {
    const invitation = await InvitationService.getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: "Приглашение не найдено или истекло" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      workspace: invitation.workspace,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      inviter: invitation.inviter,
      createdAt: invitation.createdAt
    });
  } catch (error: any) {
    console.error("Failed to get invitation:", error);
    return NextResponse.json(
      { error: "Failed to get invitation" },
      { status: 500 }
    );
  }
}

// POST /api/invite/{token}/accept - принять приглашение
export async function acceptInvitation(req: Request, context: { params: { token: string } }) {
  const { token } = context.params;
  const userId = await requireAuth();

  try {
    const invitation = await InvitationService.acceptInvitation(token, userId);

    return NextResponse.json({
      success: true,
      message: "Приглашение принято! Добро пожаловать в workspace."
    });
  } catch (error: any) {
    console.error("Failed to accept invitation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
