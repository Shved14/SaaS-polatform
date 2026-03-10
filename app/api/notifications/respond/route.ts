import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";
import { z } from "zod";

const respondSchema = z.object({
  id: z.string().cuid(),
  action: z.enum(["accept", "decline"])
});

export const POST = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const body = await parseJson(req, respondSchema);

  const notification = await prisma.notification.findFirst({
    where: {
      id: body.id,
      userId
    }
  });

  if (!notification) {
    return NextResponse.json(
      { error: "Уведомление не найдено" },
      { status: 404 }
    );
  }

  if (notification.type === "BOARD_INVITE" && body.action === "accept") {
    const data = notification.data as any;
    const workspaceId = data.workspaceId as string | undefined;

    if (workspaceId) {
      const existing = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId,
          userId
        }
      });

      if (!existing) {
        await prisma.workspaceMember.create({
          data: {
            workspaceId,
            userId,
            role: "MEMBER"
          }
        });
      }
    }
  }

  await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true }
  });

  return NextResponse.json({ ok: true });
});

