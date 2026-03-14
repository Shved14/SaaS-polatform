import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attachmentId = params.id;

    // Get attachment and check if user has access to it
    const attachment = await prisma.$queryRaw`
      SELECT ta.*, t.id as task_id, b.id as board_id, w.id as workspace_id, w."ownerId"
      FROM "TaskAttachment" ta
      JOIN "Task" t ON ta."taskId" = t.id
      JOIN "Board" b ON t."boardId" = b.id
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE ta.id = ${attachmentId}
    ` as any[];

    if (!attachment || attachment.length === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const attachmentData = attachment[0];

    // Check permissions
    const isOwner = attachmentData.ownerId === session.user.id;
    const isMember = await prisma.$queryRaw`
      SELECT 1 FROM "WorkspaceMember" 
      WHERE "userId" = ${session.user.id} AND "workspaceId" = ${attachmentData.workspace_id}
      LIMIT 1
    ` as any[];

    if (!isOwner && isMember.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete file from filesystem
    const filepath = path.join(process.cwd(), attachmentData.path);
    try {
      await unlink(filepath);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete attachment from database
    await prisma.$executeRaw`DELETE FROM "TaskAttachment" WHERE id = ${attachmentId}`;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attachmentId = params.id;

    // Get attachment and check if user has access to it
    const attachment = await prisma.$queryRaw`
      SELECT ta.*, t.id as task_id, b.id as board_id, w.id as workspace_id, w."ownerId"
      FROM "TaskAttachment" ta
      JOIN "Task" t ON ta."taskId" = t.id
      JOIN "Board" b ON t."boardId" = b.id
      JOIN "Workspace" w ON b."workspaceId" = w.id
      WHERE ta.id = ${attachmentId}
    ` as any[];

    if (!attachment || attachment.length === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const attachmentData = attachment[0];

    // Check permissions
    const isOwner = attachmentData.ownerId === session.user.id;
    const isMember = await prisma.$queryRaw`
      SELECT 1 FROM "WorkspaceMember" 
      WHERE "userId" = ${session.user.id} AND "workspaceId" = ${attachmentData.workspace_id}
      LIMIT 1
    ` as any[];

    if (!isOwner && isMember.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(attachmentData);

  } catch (error) {
    console.error("Error fetching attachment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
