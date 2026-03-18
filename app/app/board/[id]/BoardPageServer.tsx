import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BoardPageClient from "./BoardPageClient";

export default async function BoardPage({ params }: { params: { id: string } }) {

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const board = await prisma.board.findFirst({
    where: {
      id: params.id,
      workspace: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      }
    },
    include: {
      workspace: {
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      },
      tasks: {
        orderBy: [
          { priority: "desc" },
          { createdAt: "desc" }
        ]
      }
    }
  });

  if (!board) {
    redirect("/app/dashboard");
  }

  const workspaceMembers = board.workspace.members.map((m) => ({
    id: m.user.id,
    name: m.user.name || "",
    email: m.user.email || ""
  }));

  const boardTasks = board.tasks.map((task) => ({
    ...task,
    boardId: board.id,
    deadline: task.deadline ? new Date(task.deadline) : null,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt)
  }));

  return (
    <BoardPageClient
      boardId={board.id}
      workspaceId={board.workspace.id}
      tasks={boardTasks}
      workspaceMembers={workspaceMembers}
    />
  );
}
