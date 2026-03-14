import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if board already exists
    const existingBoard = await prisma.board.findFirst({
      where: {
        name: name.trim(),
        workspaceId: workspaceId
      }
    });

    if (existingBoard) {
      return NextResponse.json({ error: "BOARD_EXISTS" }, { status: 409 });
    }

    // Check board limit for free tier (example: 5 boards)
    const boardCount = await prisma.board.count({
      where: { workspaceId }
    });

    if (boardCount >= 5) {
      return NextResponse.json({ error: "BOARD_LIMIT" }, { status: 409 });
    }

    // Create new board
    const board = await prisma.board.create({
      data: {
        name: name.trim(),
        workspaceId: workspaceId
      }
    });

    return NextResponse.json({
      id: board.id,
      name: board.name,
      createdAt: board.createdAt
    });

  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
