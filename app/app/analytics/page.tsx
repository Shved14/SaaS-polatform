import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/layout/container";
import { StatusChart, type StatusChartItem } from "@/components/analytics/StatusChart";
import { UserTasksChart, type UserTasksItem } from "@/components/analytics/UserTasksChart";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  const now = new Date();

  const tasks = await prisma.task.findMany({
    where: {
      board: {
        workspace: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } }
          ]
        }
      }
    },
    include: {
      assignee: true
    }
  });

  const statusSummary: Record<StatusChartItem["status"], number> = {
    TODO: 0,
    IN_PROGRESS: 0,
    REVIEW: 0,
    DONE: 0
  };

  const userMap = new Map<string, number>();
  const overdueTasks = [];

  for (const task of tasks) {
    statusSummary[task.status as StatusChartItem["status"]] += 1;

    const assigneeName =
      task.assignee?.name ||
      task.assignee?.email ||
      "Не назначен";

    userMap.set(assigneeName, (userMap.get(assigneeName) ?? 0) + 1);

    if (
      task.deadline &&
      task.deadline < now &&
      task.status !== "DONE"
    ) {
      overdueTasks.push(task);
    }
  }

  const statusData: StatusChartItem[] = [
    { status: "TODO", label: "TODO", count: statusSummary.TODO },
    {
      status: "IN_PROGRESS",
      label: "In progress",
      count: statusSummary.IN_PROGRESS
    },
    { status: "REVIEW", label: "Review", count: statusSummary.REVIEW },
    { status: "DONE", label: "Done", count: statusSummary.DONE }
  ];

  const userTasksData: UserTasksItem[] = Array.from(userMap.entries()).map(
    ([user, count]) => ({ user, count })
  );

  return (
    <Container className="space-y-8 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Аналитика задач
        </h1>
        <p className="text-sm text-muted-foreground">
          Сводка по статусам, просроченным задачам и нагрузке на участников.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              Количество задач по статусам
            </h2>
            <p className="text-xs text-muted-foreground">
              Всего задач: {tasks.length}
            </p>
          </div>
          <StatusChart data={statusData} />
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
          <h2 className="text-sm font-semibold">Просроченные задачи</h2>
          <p className="text-xs text-muted-foreground">
            Задачи с дедлайном в прошлом и статусом, отличным от DONE.
          </p>
          <div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1 text-xs">
            {overdueTasks.length === 0 && (
              <p className="text-muted-foreground">
                Отлично! Просроченных задач нет.
              </p>
            )}
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-md border bg-muted/40 px-2 py-1.5"
              >
                <p className="font-medium">{task.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Дедлайн:{" "}
                  {task.deadline?.toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}{" "}
                  · Статус: {task.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            Количество задач на пользователя
          </h2>
          <p className="text-xs text-muted-foreground">
            Включая задачи без назначенного исполнителя.
          </p>
        </div>
        <div className="mt-4">
          <UserTasksChart data={userTasksData} />
        </div>
      </section>
    </Container>
  );
}

