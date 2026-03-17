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
      return NextResponse.json(
        { error: "Workspace не найден или нет доступа" },
        { status: 404 }
      );
    }

    const where: any = {
      user: {
        workspace: {
          id: workspaceId
        }
      }
    };

    if (entityType) {
      where.entityType = entityType;
    }

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

    return NextResponse.json(activitiesWithUsers);
  }
);
