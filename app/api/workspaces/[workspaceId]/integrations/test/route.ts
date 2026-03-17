import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

const testWebhookSchema = z.object({
  type: z.enum(["slack"])
});

// POST /api/workspaces/[workspaceId]/integrations/test - тестировать webhook
export const POST = createApiHandler(
  async (req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;
    const body = await parseJson(req, testWebhookSchema);

    // Проверяем доступ к workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        integrations: {
          where: { type: body.type, isActive: true }
        }
      }
    });

    if (!workspace || !workspace.integrations.length) {
      return NextResponse.json(
        { error: "Интеграция не найдена или неактивна" },
        { status: 404 }
      );
    }

    const integration = workspace.integrations[0];

    try {
      // Тестовое сообщение для Slack
      const testMessage = {
        text: `🧪 *Тестовое уведомление от TaskFlow*\n\n✅ Webhook успешно настроен для workspace "${workspace.name}"\n\nЭто тестовое сообщение для проверки интеграции со Slack.`,
        username: "TaskFlow",
        icon_emoji: ":robot_face:"
      };

      const response = await fetch(integration.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(testMessage)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Webhook test failed:", response.status, errorText);

        return NextResponse.json(
          {
            error: "Не удалось отправить тестовое сообщение",
            details: `HTTP ${response.status}: ${errorText}`,
            success: false
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Тестовое сообщение успешно отправлено"
      });

    } catch (error) {
      console.error("Webhook test error:", error);

      return NextResponse.json(
        {
          error: "Ошибка при отправке webhook",
          details: error instanceof Error ? error.message : "Unknown error",
          success: false
        },
        { status: 500 }
      );
    }
  }
);
