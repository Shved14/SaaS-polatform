import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET /api/invitations/info?token=...&workspaceId=... — публичная информация о приглашении
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const workspaceId = searchParams.get("workspaceId");

  if (!token || !workspaceId) {
    return NextResponse.json(
      { error: "Неверные параметры" },
      { status: 400 }
    );
  }

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token },
    include: {
      workspace: {
        select: { id: true, name: true }
      },
      inviter: {
        select: { name: true, email: true }
      }
    }
  });

  if (!invitation) {
    return NextResponse.json(
      { error: "Приглашение не найдено" },
      { status: 404 }
    );
  }

  if (invitation.workspaceId !== workspaceId) {
    return NextResponse.json(
      { error: "Приглашение не найдено" },
      { status: 404 }
    );
  }

  if (invitation.status === "accepted") {
    return NextResponse.json(
      { error: "Приглашение уже принято" },
      { status: 400 }
    );
  }

  if (invitation.status === "expired" || invitation.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Приглашение истекло" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    workspaceName: invitation.workspace.name,
    inviterName: invitation.inviter.name || invitation.inviter.email,
    email: invitation.email,
    expiresAt: invitation.expiresAt
  });
}
