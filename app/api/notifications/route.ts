import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

export const dynamic = 'force-dynamic';

export const GET = createApiHandler(async () => {
  const userId = await requireAuth();

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50
  });

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
});

const deleteSchema = z.object({
  ids: z.array(z.string()).min(1)
});

export const DELETE = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const { ids } = await parseJson(req, deleteSchema);

  const result = await prisma.notification.deleteMany({
    where: {
      userId,
      id: { in: ids }
    }
  });

  return NextResponse.json({ success: true, deletedCount: result.count });
});

