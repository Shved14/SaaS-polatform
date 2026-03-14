import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { createBoardAction } from "@/actions/workspace";
import { BoardList } from "@/components/workspace/BoardList";

interface WorkspacePageProps {
  params: { id: string };
  searchParams?: { tab?: string; error?: string };
}

export default async function WorkspacePage({
  params,
  searchParams
}: WorkspacePageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  const tab = searchParams?.tab ?? "boards";
  const errorParam = searchParams?.error;

  const workspace = await prisma.workspace.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      members: {
        include: {
          user: true
        },
        orderBy: {
          role: "asc"
        }
      },
      boards: {
        include: {
          _count: {
            select: {
              tasks: true
            }
          }
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!workspace) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, proUntil: true }
  });
  const now = new Date();
  const isPro =
    user &&
    user.plan === "PRO" &&
    (user.proUntil == null || user.proUntil > now);
  const boardsLimit = isPro ? null : 3;
  const boardCount = workspace.boards.length;

  const isOwner = workspace.ownerId === userId;
  const isMember =
    isOwner ||
    workspace.members.some((m) => {
      return m.userId === userId;
    });

  if (!isMember) {
    redirect("/app/dashboard");
  }

  return (
    <Container className="py-8 space-y-8">
      <header className="space-y-1">
        <Link
          href="/app/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Все workspace
        </Link>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {workspace.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Владелец:{" "}
              {workspace.owner?.name ||
                workspace.owner?.email ||
                "Неизвестно"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/app/workspace/${workspace.id}/analytics`}>
              <Button size="sm" variant="outline">
                Аналитика
              </Button>
            </Link>
            {isOwner && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Вы владелец workspace
              </span>
            )}
          </div>
        </div>
      </header>

      <nav className="flex gap-3 border-b text-sm">
        <WorkspaceTabLink
          workspaceId={workspace.id}
          tab="boards"
          active={tab === "boards"}
        >
          Boards
        </WorkspaceTabLink>
        <WorkspaceTabLink
          workspaceId={workspace.id}
          tab="members"
          active={tab === "members"}
        >
          Members
        </WorkspaceTabLink>
        <WorkspaceTabLink
          workspaceId={workspace.id}
          tab="settings"
          active={tab === "settings"}
        >
          Settings
        </WorkspaceTabLink>
      </nav>

      {tab === "boards" && (
        <section className="space-y-4">
          {errorParam === "board_limit" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              На бесплатном тарифе в одном workspace можно создать не более 3 досок.
              Перейдите на Pro для снятия ограничения.
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Доски</h2>
              {boardsLimit != null && (
                <span className="text-xs text-muted-foreground">
                  {boardCount} / {boardsLimit}
                </span>
              )}
            </div>
            {isOwner && (
              <form
                action={createBoardAction}
                className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
              >
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <input
                  type="text"
                  name="name"
                  placeholder="Название доски"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!isPro && boardCount >= (boardsLimit ?? 0)}
                >
                  Создать доску
                </Button>
              </form>
            )}
          </div>
          {isOwner && !isPro && boardCount >= (boardsLimit ?? 0) && (
            <p className="text-xs text-muted-foreground">
              Лимит досок достигнут. Перейдите на тариф Pro, чтобы создавать больше досок.
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <BoardList
              boards={workspace.boards}
              workspaceId={workspace.id}
              isOwner={isOwner}
            />
          </div>
          {workspace.boards.length === 0 && (
            <p className="text-sm text-muted-foreground">
              В этом workspace ещё нет досок.
            </p>
          )}
        </section>
      )}

      {tab === "members" && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Участники</h2>
          <div className="divide-y rounded-lg border bg-card">
            {workspace.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {member.user.name ||
                      member.user.email ||
                      "Без имени"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.user.email || "Email не указан"}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {member.role}
                </span>
              </div>
            ))}

            {workspace.members.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                У этого workspace пока нет участников.
              </p>
            )}
          </div>
        </section>
      )}

      {tab === "settings" && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Настройки</h2>
          {!isOwner && (
            <p className="text-sm text-muted-foreground">
              Только владелец workspace может изменять настройки и создавать
              ссылки-приглашения.
            </p>
          )}

          {isOwner && (
            <WorkspaceInviteSettings workspaceId={workspace.id} />
          )}
        </section>
      )}
    </Container>
  );
}

interface WorkspaceTabLinkProps {
  workspaceId: string;
  tab: string;
  active: boolean;
  children: React.ReactNode;
}

function WorkspaceTabLink({
  workspaceId,
  tab,
  active,
  children
}: WorkspaceTabLinkProps) {
  return (
    <Link
      href={`/app/workspace/${workspaceId}?tab=${tab}`}
      className={[
        "border-b-2 px-2 pb-2 text-xs font-medium transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

interface WorkspaceInviteSettingsProps {
  workspaceId: string;
}

function WorkspaceInviteSettings({ workspaceId }: WorkspaceInviteSettingsProps) {
  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">
        Сгенерируйте ссылку-приглашение и отправьте её участникам. При переходе
        по ссылке пользователь сможет присоединиться к workspace.
      </p>
      <WorkspaceInviteClient workspaceId={workspaceId} />
    </div>
  );
}

// Клиентский компонент для генерации ссылки приглашения
function WorkspaceInviteClient({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-sm">
      <p className="mb-2 text-xs text-muted-foreground">
        Генерация ссылки-приглашения реализована через API
        <span className="font-mono text-[11px]">
          {" POST /api/workspaces/[id]/invite"}
        </span>
        . Нажмите кнопку ниже, чтобы получить URL.
      </p>
      <p className="text-xs text-muted-foreground">
        Реализуйте на клиенте вызов этого API (fetch) и отображение полученной
        ссылки в удобном для вас виде.
      </p>
      <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
        <span>Workspace ID:</span>
        <code className="font-mono text-[11px]">{workspaceId}</code>
      </div>
    </div>
  );
}

