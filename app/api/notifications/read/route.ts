import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";
import { z } from "zod";

const markReadSchema = z.object({
  ids: z.array(z.string().cuid()).min(1)
});

export const POST = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const body = await parseJson(req, markReadSchema);

  await prisma.notification.updateMany({
    where: {
      userId,
      id: {
        in: body.ids
      }
    },
    data: {
      isRead: true
    }
  });

  return NextResponse.json({ ok: true });
});

