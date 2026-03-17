import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

// DELETE /api/workspaces/[workspaceId]/integrations/[integrationId] - удалить интеграцию
export const DELETE = createApiHandler(
  async (_req, context: { params: { workspaceId: string; integrationId: string } }) => {
    const userId = await requireAuth();
    const { workspaceId, integrationId } = context.params;

    // Проверяем доступ к workspace (только владелец может удалять интеграции)
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId, ownerId: userId }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace не найден или нет прав" },
        { status: 403 }
      );
    }

    // Проверяем существование интеграции
    const integration = await prisma.workspaceIntegration.findUnique({
      where: { 
        id: integrationId,
        workspaceId: workspaceId
      }
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Интеграция не найдена" },
        { status: 404 }
      );
    }

    // Удаляем интеграцию
    await prisma.workspaceIntegration.delete({
      where: { id: integrationId }
    });

    return NextResponse.json({ success: true });
  }
);
