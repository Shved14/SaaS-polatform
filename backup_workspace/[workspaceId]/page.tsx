import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Users, FolderOpen, Calendar } from "lucide-react";
import Link from "next/link";
import { createBoardAction, deleteBoardAction } from "@/actions/workspace";

interface WorkspacePageProps {
  params: { workspaceId: string };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: params.workspaceId,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } }
      ]
    },
    include: {
      owner: true,
      members: {
        include: {
          user: true
        }
      },
      boards: {
        orderBy: {
          createdAt: "desc"
        }
      },
      _count: {
        select: {
          members: true,
          boards: true
        }
      }
    }
  });

  if (!workspace) {
    redirect("/app/dashboard");
  }

  const isOwner = workspace.ownerId === session.user.id;

  return (
    <Container className="py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/dashboard" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Link>
          </Button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {workspace.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Рабочее пространство • {isOwner ? "Владелец" : "Участник"}
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-soft border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доски</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspace._count.boards}</div>
            <p className="text-xs text-muted-foreground">
              Активных досок
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Участники</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspace._count.members}</div>
            <p className="text-xs text-muted-foreground">
              Участников в команде
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Создано</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspace.createdAt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {workspace.createdAt.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Boards Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Доски</h2>
            <p className="text-sm text-muted-foreground">
              Управляйте досками этого рабочего пространства
            </p>
          </div>
          {isOwner && (
            <form action={createBoardAction} className="flex gap-2">
              <input
                type="text"
                name="name"
                placeholder="Название доски"
                className="px-3 py-2 border rounded-md w-48"
                required
              />
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <Button type="submit" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Создать
              </Button>
            </form>
          )}
        </div>

        {workspace.boards.length === 0 ? (
          <Card className="text-center py-12 shadow-soft border-border/60">
            <CardContent>
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ещё нет досок</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto text-center">
                Создайте вашу первую доску, чтобы начать организовывать задачи и работать с командой.
              </p>
              {isOwner && (
                <form action={createBoardAction} className="flex flex-col items-center gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Название доски"
                    className="px-4 py-2 border rounded-md w-64"
                    required
                  />
                  <input type="hidden" name="workspaceId" value={workspace.id} />
                  <Button type="submit" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Создать доску
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workspace.boards.map((board) => (
              <Card key={board.id} className="shadow-soft border-border/60 hover:shadow-soft-lg transition-all duration-200 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="text-lg">{board.name}</CardTitle>
                  <CardDescription>
                    Доска создана {board.createdAt.toLocaleDateString('ru-RU')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      Активна
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/board/${board.id}`}>Открыть</Link>
                      </Button>
                      {isOwner && (
                        <form action={deleteBoardAction}>
                          <input type="hidden" name="boardId" value={board.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            Удалить
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Members Section */}
      {isOwner && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Участники</h2>
            <p className="text-sm text-muted-foreground">
              Управляйте участниками рабочего пространства
            </p>
          </div>

          <Card className="shadow-soft border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Команда</CardTitle>
              <CardDescription>
                {workspace._count.members} участников
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workspace.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium text-primary">
                          {member.user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.user.name}</p>
                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </Container>
  );
}
