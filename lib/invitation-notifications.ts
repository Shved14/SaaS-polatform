import { prisma } from "@/lib/prisma";

export async function createInvitationNotifications() {
  try {
    // Find all pending invitations that don't have notifications yet
    const pendingInvitations = await prisma.workspaceInvitation.findMany({
      where: {
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        workspace: {
          select: {
            name: true,
          },
        },
      },
    });

    for (const invitation of pendingInvitations) {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email: invitation.email.toLowerCase() },
      });

      if (!user) continue; // Skip if user doesn't exist yet

      // Check if notification already exists
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: "WORKSPACE_INVITATION",
          data: {
            path: ["invitationId"],
            equals: invitation.id,
          },
        },
      });

      if (existingNotification) continue; // Skip if notification already exists

      // Create notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Приглашение в workspace",
          message: `Вас пригласили присоединиться к workspace «${invitation.workspace.name}»`,
          type: "WORKSPACE_INVITATION",
          data: {
            type: "workspace_invitation",
            invitationToken: invitation.token,
            workspaceId: invitation.workspaceId,
            workspaceName: invitation.workspace.name,
            inviterId: invitation.inviterId,
          },
          isRead: false,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating invitation notifications:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function markInvitationNotificationsAsRead(userId: string, invitationId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        type: "WORKSPACE_INVITATION",
        data: {
          path: ["invitationId"],
          equals: invitationId,
        },
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking invitation notifications as read:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
