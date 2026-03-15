import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

export const GET = createApiHandler(async () => {
  const userId = await requireAuth();

  // Показываем только важные и последние уведомления
  const notifications = await prisma.notification.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 20
  });

  return NextResponse.json(
    notifications.map((n) => ({
      id: n.id,
      type: n.type,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt
    }))
  );
});

