import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

const inviteSchema = z.object({
  email: z.string().email(),
});

// Generate invite link
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

// Direct invite by email
export const PUT = createApiHandler(
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

    const body = await parseJson(req, inviteSchema);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User with this email not found" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this workspace" },
        { status: 400 }
      );
    }

    // Add user as member
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: workspaceId,
        role: "MEMBER",
      },
    });

    return NextResponse.json({ success: true });
  }
);
