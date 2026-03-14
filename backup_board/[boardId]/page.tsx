import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, FolderOpen, Calendar, CheckCircle, Clock, Users } from "lucide-react";
import Link from "next/link";
import { DraggableKanbanBoard } from "@/components/kanban/DraggableKanbanBoard";

interface BoardPageProps {
  params: { boardId: string };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const board = await prisma.board.findFirst({
    where: {
      id: params.boardId,
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
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      },
      _count: {
        select: {
          tasks: true
        }
      }
    }
  });

  if (!board) {
    redirect("/app/dashboard");
  }

  const taskStats = {
    total: board.tasks.length,
    todo: board.tasks.filter(task => task.status === 'TODO').length,
    inProgress: board.tasks.filter(task => task.status === 'IN_PROGRESS').length,
    review: board.tasks.filter(task => task.status === 'REVIEW').length,
    done: board.tasks.filter(task => task.status === 'DONE').length,
  };

  return (
    <Container className="py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pl-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/app/workspace/${board.workspaceId}`} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Link>
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {board.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Доска в {board.workspace.name}
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5 pl-4">
        <Card className="shadow-soft border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Все задачи</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Всего задач
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">К выполнению</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{taskStats.todo}</div>
            <p className="text-xs text-muted-foreground">
              Ожидают выполнения
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">В работе</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              В процессе
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">На проверке</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{taskStats.review}</div>
            <p className="text-xs text-muted-foreground">
              На проверке
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Готово</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{taskStats.done}</div>
            <p className="text-xs text-muted-foreground">
              Завершено
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <section className="space-y-6 pl-4">
        <DraggableKanbanBoard
          boardId={board.id}
          tasks={board.tasks}
          workspaceMembers={board.workspace.members.map(m => ({ id: m.user.id, name: m.user.name, email: m.user.email || "" }))}
        />
      </section>
    </Container>
  );
}

function TaskCard({ task }: { task: any }) {
  const priorityColors: Record<string, string> = {
    LOW: 'priority-low',
    MEDIUM: 'priority-medium',
    HIGH: 'priority-high'
  };

  const priorityLabels: Record<string, string> = {
    LOW: 'Низкий',
    MEDIUM: 'Средний',
    HIGH: 'Высокий'
  };

  return (
    <Card className="task-card cursor-pointer">
      <CardContent className="p-3">
        <div className="space-y-2">
          <h4 className="text-sm font-medium leading-tight">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center justify-between">
            <Badge className={`text-xs ${priorityColors[task.priority] || 'priority-medium'}`}>
              {priorityLabels[task.priority] || 'Средний'}
            </Badge>
            {task.deadline && (
              <span className="text-xs text-muted-foreground">
                {new Date(task.deadline).toLocaleDateString('ru-RU')}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
