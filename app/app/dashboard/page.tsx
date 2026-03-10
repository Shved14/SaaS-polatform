import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  createWorkspaceAction,
  deleteWorkspaceAction
} from "@/actions/workspace";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

interface DashboardPageProps {
  searchParams?: { error?: string };
}

export default async function DashboardPage({
  searchParams
}: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  const errorParam = searchParams?.error;

  const [user, workspaces, ownedCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, proUntil: true }
    }),
    prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    include: {
      owner: true,
      _count: {
        select: {
          members: true,
          boards: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
    }),
    prisma.workspace.count({
      where: { ownerId: userId }
    })
  ]);

  const now = new Date();
  const isProActive =
    user &&
    user.plan === "PRO" &&
    (user.proUntil == null || user.proUntil > now);
  const workspacesLimit = isProActive ? null : 3;
  const reachedLimit =
    workspacesLimit != null && ownedCount >= workspacesLimit;

  return (
    <Container className="py-8 space-y-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Рабочие пространства
          </h1>
          <p className="text-sm text-muted-foreground">
            Управляйте своими рабочими пространствами и досками.
          </p>
        </div>
        <form action={createWorkspaceAction} className="flex gap-2">
          <input
            type="text"
            name="name"
            placeholder="Название workspace"
            className="flex h-9 w-48 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
            disabled={reachedLimit}
          />
          <Button type="submit" size="sm" disabled={reachedLimit}>
            Создать
          </Button>
        </form>
      </header>

      {errorParam === "workspace_limit" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>
              На бесплатном тарифе можно создать не более{" "}
              <span className="font-semibold">{workspacesLimit}</span>{" "}
              рабочих пространств. Удалите одно из существующих или перейдите на
              тариф Pro.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/pricing">Перейти к тарифам</Link>
            </Button>
          </div>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className="group rounded-lg border bg-card p-4 text-sm transition hover:border-primary/60 hover:shadow-sm"
          >
            <Link
              href={`/app/workspace/${ws.id}`}
              className="block"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-medium group-hover:text-primary">
                  {ws.name}
                </h2>
                {ws.ownerId === userId && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    Владелец
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Владелец: {ws.owner?.name || ws.owner?.email || "Неизвестно"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Досок: {ws._count.boards} • Участников: {ws._count.members}
              </p>
            </Link>
            {ws.ownerId === userId && (
              <form
                action={deleteWorkspaceAction}
                className="mt-3"
              >
                <input type="hidden" name="workspaceId" value={ws.id} />
                <button
                  type="submit"
                  className="text-[11px] text-red-500 hover:underline"
                >
                  Удалить workspace
                </button>
              </form>
            )}
          </div>
        ))}

        {workspaces.length === 0 && (
          <p className="text-sm text-muted-foreground">
            У вас пока нет рабочих пространств. Создайте первое.
          </p>
        )}
      </section>
    </Container>
  );
}

