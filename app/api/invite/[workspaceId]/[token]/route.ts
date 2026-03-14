import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";
import { sendInvitationAcceptedEmail } from "@/lib/email";

export const GET = createApiHandler(
  async (_req, context: { params: { workspaceId: string; token: string } }) => {
    const { workspaceId, token } = context.params;

    // Find the invitation
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        token,
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        workspace: {
          include: {
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        workspaceName: invitation.workspace.name,
        inviterName: invitation.inviter.name || invitation.inviter.email,
        expiresAt: invitation.expiresAt,
      },
    });
  }
);

export const POST = createApiHandler(
  async (req, context: { params: { workspaceId: string; token: string } }) => {
    const { workspaceId, token } = context.params;
    const userId = await requireAuth();

    // Find the invitation
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        token,
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        workspace: {
          include: {
            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        inviter: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // Get the user who is accepting the invitation
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify that the user's email matches the invitation email
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation is for a different email address" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userId,
          workspaceId: workspaceId,
        },
      },
    });

    if (existingMember) {
      // Mark invitation as accepted but user is already a member
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "accepted" },
      });

      return NextResponse.json({
        success: true,
        message: "You are already a member of this workspace",
        workspaceId,
      });
    }

    // Add user as workspace member
    await prisma.workspaceMember.create({
      data: {
        userId: userId,
        workspaceId: workspaceId,
        role: "MEMBER",
      },
    });

    // Mark invitation as accepted
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "accepted" },
    });

    // Mark related notifications as read
    await prisma.notification.updateMany({
      where: {
        userId: userId,
        type: "WORKSPACE_INVITATION",
        data: {
          path: ["invitationId"],
          equals: invitation.id,
        },
      },
      data: {
        isRead: true,
      },
    });

    // Send notification to the inviter
    await sendInvitationAcceptedEmail({
      to: invitation.inviter.email || 'unknown@example.com',
      workspaceName: invitation.workspace.name,
      newMemberName: user.name || user.email || 'Unknown',
      newMemberEmail: user.email || 'unknown@example.com',
    });

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
      workspaceId,
    });
  }
);

export const DELETE = createApiHandler(
  async (_req, context: { params: { workspaceId: string; token: string } }) => {
    const { workspaceId, token } = context.params;

    // Find and decline the invitation
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        token,
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // Mark invitation as declined
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { status: "declined" },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation declined",
    });
  }
);
