import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth, parseJson } from "@/lib/api";
import { z } from "zod";

const acceptInvitationSchema = z.object({
  invitationId: z.string(),
});

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

export const POST = createApiHandler(
  async (req) => {
    const userId = await requireAuth();

    const body = await parseJson(req, acceptInvitationSchema);
    const { invitationId } = body;

    // Get the invitation by token (not ID)
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        token: invitationId,
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        workspace: true,
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

    if (!user?.email || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
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
      where: { id: invitationId },
      data: {
        status: "accepted",
      },
    });

    return NextResponse.json({
      success: true,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
    });
  }
);

export const DELETE = createApiHandler(
  async (req) => {
    const userId = await requireAuth();

    const body = await parseJson(req, acceptInvitationSchema);
    const { invitationId } = body;

    // Get the invitation by token
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        token: invitationId,
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

    if (!user?.email || user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "This invitation is not for your email address" },
        { status: 403 }
      );
    }

    // Mark invitation as rejected
    await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: "rejected",
      },
    });

    return NextResponse.json({ success: true });
  }
);
