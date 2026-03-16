import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import path from "path";
import { createApiHandler, requireAuth } from "@/lib/api";

export const GET = createApiHandler(
  async (_req, context: { params: { id: string } }) => {
    const userId = await requireAuth();
    const attachmentId = context.params.id;

    console.log("Download request for attachment:", attachmentId);

    // Get attachment from database
    const attachment = await prisma.$queryRaw`
      SELECT * FROM "TaskAttachment" 
      WHERE id = ${attachmentId}
    ` as any[];

    if (!attachment || attachment.length === 0) {
      console.error("Attachment not found in database:", attachmentId);
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    const attachmentData = attachment[0];
    console.log("Found attachment:", attachmentData);

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
      console.error("Task not found:", attachmentData.taskId);
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const workspace = task.board.workspace;
    const isMember =
      workspace.ownerId === userId ||
      workspace.members.some((m) => m.userId === userId);

    if (!isMember) {
      console.error("Access denied for user:", userId);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Try multiple possible file paths
    const possiblePaths = [
      path.join(process.cwd(), "public", attachmentData.path),
      path.join(process.cwd(), "public", "uploads", "tasks", attachmentData.taskId, attachmentData.filename),
      path.join("/var/www/SaaS-polatform/public", attachmentData.path),
      path.join("/var/www/SaaS-polatform/public/uploads/tasks", attachmentData.taskId, attachmentData.filename),
    ];

    console.log("Trying to read file from multiple paths...");

    for (const filepath of possiblePaths) {
      console.log("Attempting to read file from:", filepath);
      
      try {
        const fs = require('fs');
        if (fs.existsSync(filepath)) {
          console.log("File exists, reading...");
          const fileBuffer = await readFile(filepath);
          console.log("File read successfully, size:", fileBuffer.length);

          // Return file with proper headers
          return new NextResponse(fileBuffer, {
            headers: {
              'Content-Type': attachmentData.contentType || 'application/octet-stream',
              'Content-Disposition': `attachment; filename="${attachmentData.originalName}"`,
              'Content-Length': fileBuffer.length.toString(),
            },
          });
        } else {
          console.log("File does not exist at:", filepath);
        }
      } catch (fileError) {
        console.error("Error reading file from", filepath, ":", fileError);
        continue; // Try next path
      }
    }

    // If none of the paths worked, return detailed error
    console.error("File not found at any of the attempted paths");
    return NextResponse.json({
      error: "File not found on disk",
      details: "Tried multiple paths but file was not found",
      attemptedPaths: possiblePaths,
      attachmentData: {
        id: attachmentData.id,
        path: attachmentData.path,
        filename: attachmentData.filename,
        taskId: attachmentData.taskId,
        originalName: attachmentData.originalName
      }
    }, { status: 404 });
  }
);
