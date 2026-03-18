import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

const declineSchema = z.object({
  token: z.string().min(1),
});

// POST /api/invitations/decline — отклонить приглашение по токену
export const POST = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const { token } = await parseJson(req, declineSchema);

  const invitation = await prisma.workspaceInvitation.findUnique({
    where: { token }
  });

  if (!invitation) {
    return NextResponse.json(
      { error: "Приглашение не найдено" },
      { status: 404 }
    );
  }

  if (invitation.status !== "pending") {
    return NextResponse.json(
      { error: "Приглашение уже обработано" },
      { status: 400 }
    );
  }

  await prisma.workspaceInvitation.update({
    where: { id: invitation.id },
    data: { status: "declined" }
  });

  return NextResponse.json({ success: true, message: "Приглашение отклонено" });
});
