import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

const createIntegrationSchema = z.object({
  type: z.enum(["slack"]),
  webhookUrl: z.string().url().min(1, "Webhook URL обязателен")
});

const updateIntegrationSchema = z.object({
  webhookUrl: z.string().url().min(1, "Webhook URL обязателен").optional(),
  isActive: z.boolean().optional()
});

// GET /api/workspaces/[workspaceId]/integrations - получить интеграции workspace
export const GET = createApiHandler(
  async (_req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;

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

    const integrations = await prisma.workspaceIntegration.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(integrations);
  }
);

// POST /api/workspaces/[workspaceId]/integrations - создать новую интеграцию
export const POST = createApiHandler(
  async (req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;
    const body = await parseJson(req, createIntegrationSchema);

    console.log("Creating integration:", { userId, workspaceId, type: body.type });

    // Проверяем доступ к workspace (только владелец может создавать интеграции)
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId, ownerId: userId }
    });

    if (!workspace) {
      console.log("Workspace not found or no access:", workspaceId);
      return NextResponse.json(
        { error: "Workspace не найден или нет прав" },
        { status: 403 }
      );
    }

    // Проверяем, что интеграция такого типа еще не существует
    const existing = await prisma.workspaceIntegration.findUnique({
      where: {
        workspaceId_type: {
          workspaceId,
          type: body.type
        }
      }
    });

    if (existing) {
      console.log("Integration already exists:", body.type);
      return NextResponse.json(
        { error: "Интеграция этого типа уже существует" },
        { status: 409 }
      );
    }

    console.log("Creating new integration...");
    const integration = await prisma.workspaceIntegration.create({
      data: {
        workspaceId,
        type: body.type,
        webhookUrl: body.webhookUrl,
        isActive: true
      }
    });

    console.log("Integration created successfully:", integration.id);
    return NextResponse.json(integration, { status: 201 });
  }
);

// PUT /api/workspaces/[workspaceId]/integrations/[type] - обновить интеграцию
export const PUT = createApiHandler(
  async (req, context: { params: { workspaceId: string, type: string } }) => {
    const userId = await requireAuth();
    const { workspaceId, type } = context.params;
    const body = await parseJson(req, updateIntegrationSchema);

    // Проверяем доступ к workspace
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
      where: {
        workspaceId_type: {
          workspaceId,
          type
        }
      }
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Интеграция не найдена" },
        { status: 404 }
      );
    }

    const updated = await prisma.workspaceIntegration.update({
      where: { id: integration.id },
      data: body
    });

    return NextResponse.json(updated);
  }
);

// DELETE /api/workspaces/[workspaceId]/integrations/[type] - удалить интеграцию
export const DELETE = createApiHandler(
  async (_req, context: { params: { workspaceId: string, type: string } }) => {
    const userId = await requireAuth();
    const { workspaceId, type } = context.params;

    // Проверяем доступ к workspace
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
      where: {
        workspaceId_type: {
          workspaceId,
          type
        }
      }
    });

    if (!integration) {
      return NextResponse.json(
        { error: "Интеграция не найдена" },
        { status: 404 }
      );
    }

    await prisma.workspaceIntegration.delete({
      where: { id: integration.id }
    });

    return NextResponse.json({ success: true });
  }
);
