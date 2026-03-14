import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

export const GET = createApiHandler(
  async (_req) => {
    const userId = await requireAuth();

    // Get user's email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 404 }
      );
    }

    // Get pending invitations for this user's email
    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        email: user.email.toLowerCase(),
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
            createdAt: true,
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        workspaceId: inv.workspaceId,
        workspaceName: inv.workspace.name,
        inviterName: inv.inviter.name || inv.inviter.email || 'Unknown',
        inviterEmail: inv.inviter.email || 'unknown@example.com',
        token: inv.token,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })),
    });
  }
);
