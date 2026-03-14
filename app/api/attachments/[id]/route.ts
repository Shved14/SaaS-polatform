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
    const attachment = await prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        task: {
          board: {
            workspace: {
              OR: [
                { ownerId: session.user.id },
                { members: { some: { userId: session.user.id } } }
              ]
            }
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Delete file from filesystem
    const filepath = path.join(process.cwd(), attachment.path);
    try {
      await unlink(filepath);
    } catch (error) {
      console.error("Error deleting file:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete attachment from database
    await prisma.taskAttachment.delete({
      where: { id: attachmentId }
    });

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
    const attachment = await prisma.taskAttachment.findFirst({
      where: {
        id: attachmentId,
        task: {
          board: {
            workspace: {
              OR: [
                { ownerId: session.user.id },
                { members: { some: { userId: session.user.id } } }
              ]
            }
          }
        }
      }
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    return NextResponse.json(attachment);

  } catch (error) {
    console.error("Error fetching attachment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
