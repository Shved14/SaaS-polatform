import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

const acceptInvitationSchema = z.object({
  invitationToken: z.string(),
});

export const POST = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const body = await parseJson(req, acceptInvitationSchema);
  const { invitationToken } = body;

  console.log('Accepting invitation:', { invitationToken, userId });

  try {
    // Find invitation by token
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        token: invitationToken,
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
    });

    if (!invitation) {
      console.log('Invitation not found or expired');
      return NextResponse.json(
        { error: "Invitation not found or expired" },
        { status: 404 }
      );
    }

    // Get user's email to verify it matches the invitation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || !user.email || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      console.log('Email mismatch:', { userEmail: user.email, invitationEmail: invitation.email });
      return NextResponse.json(
        { error: "This invitation is not for your email address" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userId,
          workspaceId: invitation.workspaceId,
        },
      },
    });

    if (existingMember) {
      console.log('User already member');
      return NextResponse.json(
        { error: "You are already a member of this workspace" },
        { status: 400 }
      );
    }

    // Add user to workspace as a member
    await prisma.workspaceMember.create({
      data: {
        userId: userId,
        workspaceId: invitation.workspaceId,
        role: "MEMBER",
      },
    });

    // Mark invitation as accepted
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
      },
    });

    // Mark all related notifications as read
    await prisma.notification.updateMany({
      where: {
        userId,
        type: "WORKSPACE_INVITATION",
        data: {
          path: ["invitationId"],
          equals: invitationToken,
        },
      },
      data: {
        isRead: true,
      },
    });

    console.log('Invitation accepted successfully');

    return NextResponse.json({
      success: true,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

export const DELETE = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const body = await parseJson(req, acceptInvitationSchema);
  const { invitationToken } = body;

  console.log('Declining invitation:', { invitationToken, userId });

  try {
    // Find invitation by token
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        token: invitationToken,
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found or expired" },
        { status: 404 }
      );
    }

    // Get user's email to verify it matches the invitation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || !user.email || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation is not for your email address" },
        { status: 403 }
      );
    }

    // Mark invitation as rejected
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "rejected",
      },
    });

    // Mark all related notifications as read
    await prisma.notification.updateMany({
      where: {
        userId,
        type: "WORKSPACE_INVITATION",
        data: {
          path: ["invitationId"],
          equals: invitationToken,
        },
      },
      data: {
        isRead: true,
      },
    });

    console.log('Invitation declined successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error declining invitation:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
