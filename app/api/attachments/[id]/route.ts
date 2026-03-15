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

    // Get attachment from database
    const attachment = await prisma.$queryRaw`
      SELECT * FROM "TaskAttachment" 
      WHERE id = ${attachmentId}
    ` as any[];

    if (!attachment || attachment.length === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const attachmentData = attachment[0];

    // Check if user has access to the task
    const task = await prisma.task.findUnique({
      where: { id: attachmentData.taskId },
      include: {
        board: {
          include: {
            workspace: {
              include: {
                members: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const workspace = task.board.workspace;
    const isMember =
      workspace.ownerId === session.user.id ||
      workspace.members.some((m) => m.userId === session.user.id);

    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete file from filesystem
    const filepath = path.join(process.cwd(), "public", attachmentData.path);
    try {
      await unlink(filepath);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete attachment from database
    await prisma.$queryRaw`DELETE FROM "TaskAttachment" WHERE id = ${attachmentId}`;

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

    // Get attachment from database
    const attachment = await prisma.$queryRaw`
      SELECT * FROM "TaskAttachment" 
      WHERE id = ${attachmentId}
    ` as any[];

    if (!attachment || attachment.length === 0) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const attachmentData = attachment[0];

    // Check if user has access to the task
    const task = await prisma.task.findUnique({
      where: { id: attachmentData.taskId },
      include: {
        board: {
          include: {
            workspace: {
              include: {
                members: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const workspace = task.board.workspace;
    const isMember =
      workspace.ownerId === session.user.id ||
      workspace.members.some((m) => m.userId === session.user.id);

    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(attachment);

  } catch (error) {
    console.error("Error fetching attachment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
