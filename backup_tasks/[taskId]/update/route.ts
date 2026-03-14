import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "DONE"])
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = updateTaskStatusSchema.parse(body);

    // Проверяем, что задача существует и пользователь имеет к ней доступ
    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        board: {
          include: {
            workspace: {
              include: {
                members: true,
                owner: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Проверяем права доступа
    const hasAccess = 
      task.board.workspace.ownerId === session.user.id ||
      task.board.workspace.members.some(member => member.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Обновляем статус задачи
    const updatedTask = await prisma.task.update({
      where: { id: params.taskId },
      data: { status }
    });

    console.log("Task updated successfully:", updatedTask);

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
