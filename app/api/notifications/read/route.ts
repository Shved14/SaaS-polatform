import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";
import { z } from "zod";

const markReadSchema = z.object({
  ids: z.array(z.string().cuid()).min(1)
});

export const POST = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const { ids } = await parseJson(req, markReadSchema);

  const result = await prisma.notification.updateMany({
    where: {
      userId,
      id: {
        in: ids
      }
    },
    data: {
      isRead: true
    }
  });

  return NextResponse.json({
    success: true,
    markedCount: result.count
  });
});

// Маркируем все уведомления как прочитанные
export const PUT = createApiHandler(async (req) => {
  const userId = await requireAuth();

  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false
    },
    data: {
      isRead: true
    }
  });

  return NextResponse.json({
    success: true,
    markedCount: result.count
  });
});

