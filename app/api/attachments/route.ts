import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const taskId = formData.get('taskId') as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!taskId) {
      return NextResponse.json({ error: "No taskId provided" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "tasks", taskId);
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Save attachment to database using raw query
    const attachmentId = `attachment_${timestamp}`;

    // Use raw query to avoid Prisma client issues
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      await prisma.$executeRaw`
        INSERT INTO "TaskAttachment" (id, "taskId", filename, "originalName", size, "contentType", path)
        VALUES (${attachmentId}, ${taskId}, ${file.name}, ${filename}, ${file.size}, ${file.type}, ${`/uploads/tasks/${taskId}/${filename}`})
      `;
    } finally {
      await prisma.$disconnect();
    }

    // Return file info
    return NextResponse.json({
      id: attachmentId,
      filename: filename,
      originalName: file.name,
      size: file.size,
      url: `/uploads/tasks/${taskId}/${filename}`
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: "No taskId provided" }, { status: 400 });
    }

    // Get all attachments for this task using raw query
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const attachments = await prisma.$queryRaw`
        SELECT id, filename, "originalName", size, "contentType", path
        FROM "TaskAttachment" 
        WHERE "taskId" = ${taskId}
        ORDER BY id DESC
      `;

      return NextResponse.json(attachments);
    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
