import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

export const dynamic = 'force-dynamic';

const updateSettingsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  taskAssigned: z.boolean().optional(),
  taskComment: z.boolean().optional(),
  taskDeadlineToday: z.boolean().optional(),
  taskOverdue: z.boolean().optional(),
  workspaceInvitation: z.boolean().optional(),
  taskCreated: z.boolean().optional(),
});

// GET /api/notifications/settings - получить настройки пользователя
export const GET = createApiHandler(async () => {
  const userId = await requireAuth();

  let settings = await prisma.notificationSettings.findUnique({
    where: { userId }
  });

  // Если настроек нет, создаем по умолчанию
  if (!settings) {
    settings = await prisma.notificationSettings.create({
      data: { userId }
    });
  }

  return NextResponse.json(settings);
});

// PUT /api/notifications/settings - обновить настройки
export const PUT = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const body = await parseJson(req, updateSettingsSchema);

  const settings = await prisma.notificationSettings.upsert({
    where: { userId },
    update: body,
    create: {
      userId,
      ...body
    }
  });

  return NextResponse.json(settings);
});
