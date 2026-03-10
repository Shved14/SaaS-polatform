import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    <div className="w-screen overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Link
              href={`/app/workspace/${board.workspace.id}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <span>← Назад к workspace</span>
            </Link>
            <div>
              <p className="text-xs text-muted-foreground">
                Workspace: {board.workspace.name}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {board.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4 touch-pan-x">
        <div className="px-4 md:px-6 lg:px-8">
          <KanbanBoard
            boardId={board.id}
            initialTasks={tasks}
            members={members}
          />
        </div>
      </div>
    </div>
  );
}

