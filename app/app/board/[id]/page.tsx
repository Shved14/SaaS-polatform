import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/layout/container";
import KanbanBoard from "@/components/kanban/KanbanBoard";

interface BoardPageProps {
  params: { id: string };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  const board = await prisma.board.findUnique({
    where: { id: params.id },
    include: {
      workspace: {
        include: {
          owner: true,
          members: {
            include: { user: true }
          }
        }
      },
      tasks: {
        include: {
          assignee: true
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!board) {
    notFound();
  }

  const isOwner = board.workspace.ownerId === userId;
  const isMember =
    isOwner ||
    board.workspace.members.some((m) => {
      return m.userId === userId;
    });

  if (!isMember) {
    redirect("/app/dashboard");
  }

  const members = board.workspace.members.map((m) => ({
    id: m.user.id,
    name: m.user.name || m.user.email || "Без имени"
  }));

  const tasks = board.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    assigneeId: t.assigneeId,
    assigneeName:
      t.assignee?.name || t.assignee?.email || t.assigneeId || null
  }));

  return (
    <Container className="py-6 space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">
            Workspace: {board.workspace.name}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {board.name}
          </h1>
        </div>
      </div>

      <KanbanBoard
        boardId={board.id}
        initialTasks={tasks}
        members={members}
      />
    </Container>
  );
}

