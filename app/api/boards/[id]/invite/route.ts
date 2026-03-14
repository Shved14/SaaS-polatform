import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";
import { sendWorkspaceInvitationEmail } from "@/lib/email";

const inviteSchema = z.object({
  email: z.string().email(),
});

export const POST = createApiHandler(async (req, context) => {
  const userId = await requireAuth();
  const boardId = context.params.id;
  const body = await parseJson(req, inviteSchema);

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: {
        include: {
          members: true,
          owner: true,
        },
      },
    },
  });

  if (!board) {
    return NextResponse.json(
      { error: "Доска не найдена" },
      { status: 404 }
    );
  }

  const workspace = board.workspace;
  const isOwner = workspace.ownerId === userId;

  if (!isOwner) {
    return NextResponse.json(
      { error: "Только владелец workspace может приглашать пользователей" },
      { status: 403 }
    );
  }

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (existingUser) {
    const existingMember = workspace.members.find(
      (m) => m.userId === existingUser.id
    );

    if (existingMember) {
      return NextResponse.json(
        { error: "Пользователь уже является участником workspace" },
        { status: 400 }
      );
    }
  }

  // Create invitation
  const invitation = await prisma.workspaceInvitation.create({
    data: {
      workspaceId: workspace.id,
      email: body.email,
      inviterId: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    include: {
      inviter: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Send invitation email
  const invitationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${workspace.id}/${invitation.token}`;

  try {
    await sendWorkspaceInvitationEmail({
      to: body.email,
      workspaceName: workspace.name,
      inviterName: invitation.inviter.name || invitation.inviter.email,
      inviterEmail: invitation.inviter.email,
      invitationToken: invitation.token,
      workspaceId: workspace.id,
      isNewUser: !existingUser,
    });
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    // Continue even if email fails
  }

  return NextResponse.json({
    message: "Приглашение отправлено",
    invitation: {
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expiresAt,
    },
  });
});
