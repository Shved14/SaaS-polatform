import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

const inviteSchema = z.object({
  email: z.string().email(),
});

export const POST = createApiHandler(
  async (req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;

    try {
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

      // Check if user exists in system
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

      // Create notification if user exists
      if (user) {
        try {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "WORKSPACE_INVITATION",
              data: {
                invitationId: invitation.token, // Use token for notifications
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
          // Don't fail request if notification creation fails
        }
      }

      return NextResponse.json({
        success: true,
        message: user ? "Invitation sent via notification" : "Invitation created (user not in system)",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          status: invitation.status,
          token: invitation.token,
        }
      });
    } catch (error) {
      console.error('Invitation creation error:', error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }
);
