"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/sanitize";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/auth/signin");
  }
  return userId;
}

export async function createWorkspaceAction(formData: FormData) {
  const userId = await requireUserId();
  const name = sanitizeString(formData.get("name"), 100);

  if (!name) {
    return;
  }

   // Проверяем план пользователя и лимит workspace'ов
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, proUntil: true }
  });

  const now = new Date();
  const isProActive =
    user &&
    user.plan === "PRO" &&
    (user.proUntil == null || user.proUntil > now);

  if (!isProActive) {
    const ownedCount = await prisma.workspace.count({
      where: { ownerId: userId }
    });

    // Бесплатный тариф: не более 3 собственных workspace'ов
    if (ownedCount >= 3) {
      redirect("/app/dashboard?error=workspace_limit");
    }
  }

  // Не позволяем создавать workspace с одинаковым названием для одного владельца
  const existingByName = await prisma.workspace.findFirst({
    where: {
      ownerId: userId,
      name
    }
  });

  if (existingByName) {
    redirect(`/app/workspace/${existingByName.id}`);
  }

  const workspace = await prisma.workspace.create({
    data: {
      name,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: "OWNER"
        }
      }
    }
  });

  redirect(`/app/workspace/${workspace.id}`);
}

const FREE_BOARDS_LIMIT = 3;

export async function createBoardAction(formData: FormData) {
  const userId = await requireUserId();
  const name = sanitizeString(formData.get("name"), 100);
  const workspaceId = String(formData.get("workspaceId") ?? "");

  if (!name || !workspaceId) {
    return;
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      userId
    }
  });

  if (!membership) {
    redirect("/app/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, proUntil: true }
  });

  const now = new Date();
  const isProActive =
    user &&
    user.plan === "PRO" &&
    (user.proUntil == null || user.proUntil > now);

  if (!isProActive) {
    const boardCount = await prisma.board.count({
      where: { workspaceId }
    });
    if (boardCount >= FREE_BOARDS_LIMIT) {
      redirect(
        `/app/workspace/${workspaceId}?tab=boards&error=board_limit`
      );
    }
  }

  await prisma.board.create({
    data: {
      name,
      workspaceId
    }
  });

  redirect(`/app/workspace/${workspaceId}?tab=boards`);
}

export async function deleteWorkspaceAction(formData: FormData) {
  const userId = await requireUserId();
  const workspaceId = String(formData.get("workspaceId") ?? "");

  if (!workspaceId) return;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true }
  });

  if (!workspace || workspace.ownerId !== userId) {
    redirect("/app/dashboard");
  }

  await prisma.workspace.delete({
    where: { id: workspaceId }
  });

  redirect("/app/dashboard");
}

export async function deleteBoardAction(formData: FormData) {
  const userId = await requireUserId();
  const boardId = String(formData.get("boardId") ?? "");

  if (!boardId) return;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      workspace: true
    }
  });

  if (!board) {
    redirect("/app/dashboard");
  }

  if (board.workspace.ownerId !== userId) {
    redirect(`/app/workspace/${board.workspaceId}`);
  }

  await prisma.board.delete({
    where: { id: boardId }
  });

  redirect(`/app/workspace/${board.workspaceId}?tab=boards`);
}
