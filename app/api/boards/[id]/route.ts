import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createApiHandler, parseJson, requireAuth } from "@/lib/api";

const createBoardSchema = z.object({
  name: z.string().min(1).max(100),
  workspaceId: z.string().cuid(),
});

export const GET = createApiHandler(async (_req) => {
  const userId = await requireAuth();

  const boards = await prisma.board.findMany({
    where: {
      workspace: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(boards);
});

export const POST = createApiHandler(async (req) => {
  const userId = await requireAuth();
  const body = await parseJson(req, createBoardSchema);

  // Check if user is member of the workspace
  const workspace = await prisma.workspace.findUnique({
    where: { id: body.workspaceId },
    include: {
      members: true,
    },
  });

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace не найден" },
      { status: 404 }
    );
  }

  const isMember =
    workspace.ownerId === userId ||
    workspace.members.some((m) => m.userId === userId);

  if (!isMember) {
    return NextResponse.json(
      { error: "Нет доступа к этому workspace" },
      { status: 403 }
    );
  }

  const board = await prisma.board.create({
    data: {
      name: body.name,
      workspaceId: body.workspaceId,
    },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json(board);
});
