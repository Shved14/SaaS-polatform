import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

export const GET = createApiHandler(async () => {
  const userId = await requireAuth();

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        type: "WORKSPACE_INVITATION",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
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
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    return NextResponse.json({
      user,
      notifications,
      invitations,
      count: {
        notifications: notifications.length,
        invitations: invitations.length,
      },
    });
  } catch (error) {
    console.error('Error debugging notifications:', error);
    return NextResponse.json(
      { error: "Failed to debug notifications" },
      { status: 500 }
    );
  }
});
