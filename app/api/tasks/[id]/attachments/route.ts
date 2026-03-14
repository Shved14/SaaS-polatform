import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;

    // Check if user has access to task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        board: {
          workspace: {
            OR: [
              { ownerId: session.user.id },
              { members: { some: { userId: session.user.id } } }
            ]
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads", "tasks", taskId);
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    await writeFile(filepath, Buffer.from(bytes));

    // Save attachment to database
    console.log("Saving attachment to database...");
    const attachmentId = `attachment_${Date.now()}`;

    await prisma.$executeRaw`
      INSERT INTO "TaskAttachment" (id, "taskId", filename, "originalName", size, "contentType", path, "createdAt")
      VALUES (${attachmentId}, ${taskId}, ${file.name}, ${filename}, ${file.size}, ${file.type}, ${`/uploads/tasks/${taskId}/${filename}`}, NOW())
    `;

    console.log("Attachment saved with ID:", attachmentId);

    return NextResponse.json({
      id: attachmentId,
      filename: filename,
      size: file.size,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error uploading file:", error);
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

    const taskId = params.id;

    // Check if user has access to task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        board: {
          workspace: {
            OR: [
              { ownerId: session.user.id },
              { members: { some: { userId: session.user.id } } }
            ]
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get all attachments for this task
    const attachments = await prisma.$queryRaw`
      SELECT id, filename, "originalName", size, "contentType", path, "createdAt"
      FROM "TaskAttachment" 
      WHERE "taskId" = ${taskId}
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json(attachments);

  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
