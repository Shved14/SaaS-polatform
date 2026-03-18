import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

const updateIntegrationSchema = z.object({
  webhookUrl: z.string().url().optional(),
  isActive: z.boolean().optional()
});

// PUT /api/workspaces/[workspaceId]/integrations/[integrationId] - обновить интеграцию
export const PUT = createApiHandler(
  async (req, context: { params: { workspaceId: string; integrationId: string } }) => {
    const userId = await requireAuth();
    const { workspaceId, integrationId } = context.params;

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId, ownerId: userId }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace не найден или нет прав" },
        { status: 403 }
      );
    }

    const integration = await prisma.workspaceIntegration.findUnique({
      where: { id: integrationId, workspaceId }
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Интеграция не найдена" },
        { status: 404 }
      );
    }

    const body = await parseJson(req, updateIntegrationSchema);

    const updated = await prisma.workspaceIntegration.update({
      where: { id: integrationId },
      data: body
    });

    return NextResponse.json(updated);
  }
);

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
