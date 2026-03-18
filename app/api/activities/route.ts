import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

const activitiesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  entityType: z.enum(["task", "board", "workspace", "comment"]).optional(),
  entityId: z.string().optional(),
  action: z.enum([
    "created_task", "updated_task", "deleted_task", "comment_added",
    "status_changed", "assigned_task", "unassigned_task",
    "created_board", "updated_board", "deleted_board",
    "invited_user", "joined_workspace", "left_workspace"
  ]).optional(),
  workspaceId: z.string().optional()
});

// GET /api/activities - получить историю действий
export const GET = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const searchParams = new URL(req.url).searchParams;

  try {
    const query = activitiesQuerySchema.parse({
      limit: searchParams.get("limit"),
      entityType: searchParams.get("entityType"),
      entityId: searchParams.get("entityId"),
      action: searchParams.get("action"),
      workspaceId: searchParams.get("workspaceId")
    });

    let where: any = {};

    // Если указан workspaceId, фильтруем по нему и проверяем доступ
    if (query.workspaceId) {
      // Проверяем доступ к workspace
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: query.workspaceId,
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
      });

      if (!workspace) {
        return NextResponse.json(
          { error: "Workspace not found or no access" },
          { status: 403 }
        );
      }

      // Фильтруем активности по workspace
      where.OR = [
        {
          entityType: "workspace",
          entityId: query.workspaceId
        },
        // Также можно добавить фильтрацию по задачам и доскам из этого workspace
        // если нужно будет расширить функциональность
      ];
    } else {
      // Если workspaceId не указан, показываем только активности пользователя
      where.userId = userId;
    }

    if (query.entityType) {
      where.entityType = query.entityType;
    }

    if (query.entityId) {
      where.entityId = query.entityId;
    }

    if (query.action) {
      where.action = query.action;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: query.limit || 50,
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

    // Форматирование активностей для отображения
    const formattedActivities = activities.map(activity => {
      let description = '';
      const details = activity.details as any;

      switch (activity.action) {
        case 'created_task':
          description = `создал(а) задачу "${details?.newValue?.title || ''}"`;
          break;
        case 'updated_task':
          description = `обновил(а) задачу "${details?.newValue?.title || ''}"`;
          break;
        case 'deleted_task':
          description = `удалил(а) задачу "${details?.newValue?.title || ''}"`;
          break;
        case 'assigned_task':
          description = `назначил(а) задачу "${details?.newValue?.title || ''}"`;
          break;
        case 'unassigned_task':
          description = `снял(а) назначение с задачи "${details?.newValue?.title || ''}"`;
          break;
        case 'status_changed':
          description = `изменил(а) статус задачи на "${details?.newValue?.status || ''}"`;
          break;
        case 'comment_added':
          description = `добавил(а) комментарий к задаче "${details?.newValue?.title || ''}"`;
          break;
        case 'created_board':
          description = `создал(а) доску "${details?.newValue?.name || ''}"`;
          break;
        case 'updated_board':
          description = `обновил(а) доску "${details?.newValue?.name || ''}"`;
          break;
        case 'deleted_board':
          description = `удалил(а) доску "${details?.newValue?.name || ''}"`;
          break;
        case 'invited_user':
          description = `пригласил(а) пользователя в workspace`;
          break;
        case 'joined_workspace':
          description = `присоединился(а) к workspace`;
          break;
        case 'left_workspace':
          description = `покинул(а) workspace`;
          break;
        default:
          description = `выполнил(а) действие: ${activity.action}`;
      }

      return {
        id: activity.id,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        description,
        details: activity.details,
        metadata: activity.metadata,
        createdAt: activity.createdAt,
        user: activity.user
      };
    });

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error("Failed to get activities:", error);
    return NextResponse.json(
      { error: "Failed to get activities" },
      { status: 500 }
    );
  }
});
