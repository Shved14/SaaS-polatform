import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const taskId = formData.get("taskId") as string;

    if (!file || !taskId) {
      return NextResponse.json({ error: "No file or taskId provided" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", "tasks", taskId);
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const filePath = join(uploadsDir, filename);

    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Save to database
    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        filename,
        originalName: file.name,
        size: file.size,
        contentType: file.type,
        path: `/uploads/tasks/${taskId}/${filename}`
      }
    });

    return NextResponse.json(attachment);

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

    // Get attachments from database
    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(attachments);

  } catch (error) {
    console.error("Error fetching attachments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
