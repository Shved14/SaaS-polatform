import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

export const dynamic = 'force-dynamic';

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

    try {
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

      // Форматируем активности для отображения
      const formattedActivities = activities.map(activity => ({
        id: activity.id,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        description: getActivityDescription(activity),
        details: activity.details,
        createdAt: activity.createdAt,
        user: activity.user
      }));

      console.log("Returning activities:", formattedActivities.length);
      return NextResponse.json(formattedActivities);
    } catch (error) {
      console.error("Activity query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch activities", details: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 }
      );
    }
  }
);

// Вспомогательная функция для получения описания активности
function getActivityDescription(activity: any): string {
  const details = activity.details as any;

  switch (activity.action) {
    case 'created_task':
      return `создал(а) задачу "${details?.newValue?.title || ''}"`;
    case 'updated_task':
      return `обновил(а) задачу "${details?.newValue?.title || ''}"`;
    case 'deleted_task':
      return `удалил(а) задачу "${details?.newValue?.title || ''}"`;
    case 'created_board':
      return `создал(а) доску "${details?.newValue?.name || ''}"`;
    case 'deleted_board':
      return `удалил(а) доску "${details?.newValue?.name || ''}"`;
    case 'invited_user':
      return `пригласил(а) пользователя в workspace`;
    case 'joined_workspace':
      return `присоединился(а) к workspace`;
    case 'left_workspace':
      return `покинул(а) workspace`;
    default:
      return `выполнил(а) действие: ${activity.action}`;
  }
}
