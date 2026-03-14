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

interface BoardPageProps {
  params: { id: string };
}

export default async function BoardPage({ params }: BoardPageProps) {
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
      workspace: true,
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <Button className="gap-2 shadow-soft hover:shadow-soft-lg transition-all duration-200">
          <Plus className="h-4 w-4" />
          Создать задачу
        </Button>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
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
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Kanban доска</h2>
            <p className="text-sm text-muted-foreground">
              Перетаскивайте задачи между колонками для изменения статуса
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Новая задача
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {/* TODO Column */}
          <div className="kanban-column kanban-column-todo">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">К выполнению</h3>
              <Badge variant="outline" className="text-xs">
                {taskStats.todo}
              </Badge>
            </div>
            <div className="space-y-2">
              {board.tasks
                .filter(task => task.status === 'TODO')
                .map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              {taskStats.todo === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Нет задач
                </div>
              )}
            </div>
          </div>

          {/* IN_PROGRESS Column */}
          <div className="kanban-column kanban-column-inprogress">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">В работе</h3>
              <Badge variant="outline" className="text-xs">
                {taskStats.inProgress}
              </Badge>
            </div>
            <div className="space-y-2">
              {board.tasks
                .filter(task => task.status === 'IN_PROGRESS')
                .map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              {taskStats.inProgress === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Нет задач
                </div>
              )}
            </div>
          </div>

          {/* REVIEW Column */}
          <div className="kanban-column kanban-column-review">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">На проверке</h3>
              <Badge variant="outline" className="text-xs">
                {taskStats.review}
              </Badge>
            </div>
            <div className="space-y-2">
              {board.tasks
                .filter(task => task.status === 'REVIEW')
                .map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              {taskStats.review === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Нет задач
                </div>
              )}
            </div>
          </div>

          {/* DONE Column */}
          <div className="kanban-column kanban-column-done">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm">Готово</h3>
              <Badge variant="outline" className="text-xs">
                {taskStats.done}
              </Badge>
            </div>
            <div className="space-y-2">
              {board.tasks
                .filter(task => task.status === 'DONE')
                .map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              {taskStats.done === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Нет задач
                </div>
              )}
            </div>
          </div>
        </div>
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
