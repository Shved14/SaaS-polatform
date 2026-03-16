import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createApiHandler } from "@/lib/api";

export const GET = createApiHandler(
  async (_req, context: { params: { token: string } }) => {
    const { token } = context.params;

    // Get invitation by token
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
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
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if invitation is still valid
    if (invitation.status !== "pending" || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation is no longer valid" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      inviterName: invitation.inviter.name || invitation.inviter.email || 'Unknown',
      inviterEmail: invitation.inviter.email || 'unknown@example.com',
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    });
  }
);

export const POST = createApiHandler(
  async (req, context: { params: { token: string } }) => {
    const { token } = context.params;

    // Get invitation by token
    const invitation = await prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if invitation is still valid
    if (invitation.status !== "pending" || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation is no longer valid" },
        { status: 400 }
      );
    }

    // Get current user (must be logged in)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to accept invitation" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user's email to verify it matches invitation
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
      where: { id: invitation.id },
      data: {
        status: "accepted",
      },
    });

    return NextResponse.json({
      success: true,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      redirectUrl: `/app/workspace/${invitation.workspaceId}`,
    });
  }
);
