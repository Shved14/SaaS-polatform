import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { assertRateLimit, createApiHandler, requireAuth } from "@/lib/api";

function generateToken(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const POST = createApiHandler(async (req, context) => {
  const userId = await requireAuth();

  // rate limiting по IP для генерации инвайтов
  assertRateLimit(req, "workspace_invite");

  const workspaceId = context.params.id;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId }
  });

  if (!workspace) {
    throw new Error("Workspace не найден");
  }

  if (workspace.ownerId !== userId) {
    return NextResponse.json(
      { error: "Только владелец workspace может создавать приглашения" },
      { status: 403 }
    );
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней

  const invite = await prisma.inviteLink.create({
    data: {
      workspaceId,
      token,
      expiresAt
    }
  });

  const baseUrl =
    env.NEXTAUTH_URL ??
    (env.VERCEL_URL?.startsWith("http")
      ? env.VERCEL_URL
      : `https://${env.VERCEL_URL ?? "localhost:3000"}`);

  const inviteUrl = `${baseUrl}/invite/${invite.token}`;

  return NextResponse.json({ inviteUrl });
});

