import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

const acceptSchema = z.object({
  token: z.string().min(1),
});

// POST /api/invitations/accept — принять приглашение по токену
export const POST = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const { token } = await parseJson(req, acceptSchema);

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: {
        select: { id: true, name: true }
      }
    }
  });

  if (!invitation) {
    return NextResponse.json(
      { error: "Приглашение не найдено" },
      { status: 404 }
    );
  }

  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: invitation.status === "accepted" ? "Приглашение уже принято" : "Приглашение истекло" },
      { status: 400 }
    );
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "expired" }
    });
    return NextResponse.json(
      { error: "Приглашение истекло" },
      { status: 400 }
    );
  }

  // Проверяем, не является ли пользователь уже участником
  const existingMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: invitation.workspaceId,
      userId
    }
  });

  if (existingMember) {
    // Помечаем как принятое даже если уже участник
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "accepted" }
    });
    return NextResponse.json({
      success: true,
      workspaceId: invitation.workspaceId,
      message: "Вы уже являетесь участником этого workspace"
    });
  }

  // Получаем имя пользователя для активности
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true }
  });
  const userName = user?.name || user?.email || "Пользователь";

  // Принимаем приглашение
  await prisma.$transaction([
    prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "accepted" }
    }),
    prisma.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId,
        role: "MEMBER"
      }
    }),
    prisma.activity.create({
      data: {
        userId,
        action: "joined_workspace",
        entityId: invitation.workspaceId,
        entityType: "workspace",
        details: {
          workspaceName: invitation.workspace.name,
          userName
        },
        metadata: {
          invitationToken: token
        }
      }
    })
  ]);

  return NextResponse.json({
    success: true,
    workspaceId: invitation.workspaceId,
    workspaceName: invitation.workspace.name,
    message: "Приглашение принято"
  });
});
