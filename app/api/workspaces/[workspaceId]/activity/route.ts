import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

const getActivitiesSchema = z.object({
  limit: z.coerce.number().optional().default(20),
  entityType: z.enum(["task", "board", "workspace", "comment", "user"]).optional()
});

// GET /api/workspaces/[workspaceId]/activity - получить активность workspace
export const GET = createApiHandler(
  async (req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;
    const url = new URL(req.url || '', 'http://localhost');
    const searchParams = url.searchParams;

    const limit = parseInt(searchParams.get('limit') || '20');
    const entityType = searchParams.get('entityType') as any;

    console.log("Getting activities:", { userId, workspaceId, limit, entityType });

    // Проверяем доступ к workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      }
    });

    if (!workspace) {
      console.log("Workspace not found:", workspaceId);
      return NextResponse.json(
        { error: "Workspace не найден или нет доступа" },
        { status: 404 }
      );
    }

    // Получаем ID досок и задач для этого workspace
    const boards = await prisma.board.findMany({
      where: { workspaceId },
      select: { id: true }
    });

    const tasks = await prisma.task.findMany({
      where: {
        board: { workspaceId }
      },
      select: { id: true }
    });

    console.log("Found boards:", boards.length, "tasks:", tasks.length);

    const where: any = {
      // Получаем активности для всех сущностей в этом workspace
      OR: [
        // Активности для досок этого workspace
        {
          entityType: "board",
          entityId: {
            in: boards.map(b => b.id)
          }
        },
        // Активности для задач этого workspace
        {
          entityType: "task",
          entityId: {
            in: tasks.map(t => t.id)
          }
        },
        // Активности для самого workspace
        {
          entityType: "workspace",
          entityId: workspaceId
        }
      ]
    };

    if (entityType) {
      where.entityType = entityType;
    }

    console.log("Activity where clause:", where);

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    console.log("Found activities:", activities.length);

    // Добавляем данные о пользователях
    const activitiesWithUsers = activities.map(activity => ({
      ...activity,
      user: activity.user,
      action: activity.action,
      entityId: activity.entityId,
      entityType: activity.entityType,
      details: activity.details,
      createdAt: activity.createdAt
    }));

    console.log("Returning activities:", activitiesWithUsers.length);
    return NextResponse.json(activitiesWithUsers);
  }
);
