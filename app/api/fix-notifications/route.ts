import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

export const POST = createApiHandler(async () => {
  const userId = await requireAuth();

  try {
    // Get all pending workspace invitations for this user
    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        email: {
          in: await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
          }).then(user => user?.email ? [user.email.toLowerCase()] : [])
        },
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`Found ${invitations.length} pending invitations for user`);

    // Delete old notifications
    await prisma.notification.deleteMany({
      where: {
        userId,
        type: "WORKSPACE_INVITATION",
      },
    });

    // Create new notifications with correct token
    for (const invitation of invitations) {
      await prisma.notification.create({
        data: {
          userId,
          type: "WORKSPACE_INVITATION",
          data: {
            invitationId: invitation.token, // Use token instead of ID
            workspaceId: invitation.workspaceId,
            workspaceName: invitation.workspace.name,
            inviterId: invitation.inviterId,
            token: invitation.token,
            message: `You've been invited to join "${invitation.workspace.name}"`,
          },
          isRead: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${invitations.length} notifications`,
    });
  } catch (error) {
    console.error('Error fixing notifications:', error);
    return NextResponse.json(
      { error: "Failed to fix notifications" },
      { status: 500 }
    );
  }
});
