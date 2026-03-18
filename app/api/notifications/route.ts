import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, requireAuth } from "@/lib/api";

export const GET = createApiHandler(async () => {
  try {
    console.log("Notifications API called");
    const userId = await requireAuth();
    console.log("User authenticated:", userId);

    // Показываем только важные и последние уведомления
    const notifications = await prisma.notification.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50 // Увеличим лимит для лучшего UX
    });

    console.log("Found notifications:", notifications.length);
    return NextResponse.json(
      notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        isRead: n.isRead,
        createdAt: n.createdAt
      }))
    );
  } catch (error) {
    console.error("Notifications API error:", error);
    throw error;
  }
});

