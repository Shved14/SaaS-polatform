import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";
import { sendWorkspaceInvitationEmail } from "@/lib/email";

const inviteSchema = z.object({
  email: z.string().email(),
});

// Generate invite link (deprecated, kept for backward compatibility)
export const POST = createApiHandler(
  async (req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;

    // Check if user is workspace owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (workspace.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only workspace owners can invite members" },
        { status: 403 }
      );
    }

    // Generate a unique invite token
    const inviteToken = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Store the invite token
    await prisma.inviteLink.create({
      data: {
        workspaceId,
        token: inviteToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${workspaceId}/${inviteToken}`;

    return NextResponse.json({
      inviteToken,
      inviteUrl
    });
  }
);

// Email invitation (new improved system)
export const PUT = createApiHandler(
  async (req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;

    // Check if user is workspace owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (workspace.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only workspace owners can invite members" },
        { status: 403 }
      );
    }

    const body = await parseJson(req, inviteSchema);
    const { email } = body;

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspaceId,
        user: {
          email: email.toLowerCase(),
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this workspace" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.workspaceInvitation.findFirst({
      where: {
        email: email.toLowerCase(),
        workspaceId: workspaceId,
        status: "pending",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email" },
        { status: 400 }
      );
    }

    // Check if user exists in the system
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Generate invitation token
    const invitationToken = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // Create invitation record
    const invitation = await prisma.workspaceInvitation.create({
      data: {
        email: email.toLowerCase(),
        workspaceId,
        inviterId: userId,
        status: "pending",
        token: invitationToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send email invitation
    const emailResult = await sendWorkspaceInvitationEmail({
      to: email,
      workspaceName: workspace.name,
      inviterName: workspace.owner.name || workspace.owner.email || 'Unknown',
      inviterEmail: workspace.owner.email || 'unknown@example.com',
      invitationToken,
      workspaceId,
      isNewUser: !user,
    });

    if (!emailResult.ok) {
      // If email fails, delete the invitation record
      await prisma.workspaceInvitation.delete({
        where: { id: invitation.id },
      });

      return NextResponse.json(
        { error: `Failed to send invitation email: ${emailResult.error}` },
        { status: 500 }
      );
    }

    // Create notification if user exists
    if (user) {
      try {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "WORKSPACE_INVITATION",
            data: {
              invitationId: invitation.id,
              workspaceId: workspaceId,
              workspaceName: workspace.name,
              inviterId: userId,
              token: invitationToken,
              message: `You've been invited to join "${workspace.name}"`,
            },
            isRead: false,
          },
        });
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError);
        // Don't fail the request if notification creation fails
      }
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      }
    });
  }
);
