import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";

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

    // Check if user has access to task
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

    // Read file from disk
    const filepath = path.join(process.cwd(), "public", attachmentData.path);
    
    try {
      const fileBuffer = await readFile(filepath);
      
      // Return file with proper headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': attachmentData.contentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${attachmentData.originalName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    } catch (fileError) {
      console.error("Error reading file:", fileError);
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
    }

  } catch (error) {
    console.error("Error downloading attachment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
