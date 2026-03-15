import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/sanitize";
import {
  createApiHandler,
  requireAuth
} from "@/lib/api";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const FREE_BOARDS_LIMIT = 3;

const createBoardSchema = z.object({
  name: z.string().min(1),
});

// POST использует createApiHandler (у него внутри уже есть try/catch)
export const POST = createApiHandler(
  async (req, context: { params: { workspaceId: string } }) => {
    const userId = await requireAuth();
    const workspaceId = context.params.workspaceId;
    const body = await req.json();
    const { name } = createBoardSchema.parse(body);

    if (!name.trim()) {
      return NextResponse.json(
        { error: "Название доски не может быть пустым" },
        { status: 400 }
      );
    }

    // Check if user is workspace owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true, name: true }
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    if (workspace.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only workspace owners can create boards" },
        { status: 403 }
      );
    }

    // Check user plan
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, proUntil: true }
    });

    const now = new Date();
    const isProActive =
      user &&
      user.plan === "PRO" &&
      (user.proUntil == null || user.proUntil > now);

    // Check board limit for free users
    if (!isProActive) {
      const boardCount = await prisma.board.count({
        where: { workspaceId }
      });
      if (boardCount >= FREE_BOARDS_LIMIT) {
        return NextResponse.json(
          { error: "Достигнут лимит досок для бесплатного тарифа" },
          { status: 400 }
        );
      }
    }

    // Check if board name already exists
    const existingBoard = await prisma.board.findFirst({
      where: {
        workspaceId,
        name: name.trim()
      }
    });

    if (existingBoard) {
      return NextResponse.json(
        { error: "Доска с таким названием уже существует" },
        { status: 400 }
      );
    }

    // Create new board
    const board = await prisma.board.create({
      data: {
        name: name.trim(),
        workspaceId
      }
    });

    return NextResponse.json({
      id: board.id,
      name: board.name,
      createdAt: board.createdAt
    });
  }
); // <-- Закрываем createApiHandler

// GET использует обычную функцию (свой try/catch)
export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = params.workspaceId;

    // Check if user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      }
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Get all boards for this workspace
    const boards = await prisma.board.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(boards);

  } catch (error) {
    console.error("Error fetching boards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} // <-- Закрываем GET функцию