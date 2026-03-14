"use client";

import { useState, useMemo } from "react";
import { StatusChart, type StatusChartItem } from "@/components/analytics/StatusChart";
import { UserTasksChart, type UserTasksItem } from "@/components/analytics/UserTasksChart";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";

interface AnalyticsClientProps {
  tasks: any[];
  workspaces: { id: string; name: string }[];
  boards: { id: string; name: string; workspaceId: string }[];
}

export function AnalyticsClient({ tasks, workspaces, boards }: AnalyticsClientProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);

  // Фильтруем задачи на основе выбранных фильтров
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (selectedWorkspace) {
      filtered = filtered.filter(task => 
        task.board.workspaceId === selectedWorkspace
      );
    }

    if (selectedBoard) {
      filtered = filtered.filter(task => 
        task.boardId === selectedBoard
      );
    }

    return filtered;
  }, [tasks, selectedWorkspace, selectedBoard]);

  // Считаем статистику на основе отфильтрованных задач
  const analyticsData = useMemo(() => {
    const statusSummary: Record<StatusChartItem["status"], number> = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0
    };

    const userMap = new Map<string, number>();
    const overdueTasks = [];

    for (const task of filteredTasks) {
      statusSummary[task.status as StatusChartItem["status"]] += 1;

      const assigneeName =
        task.assignee?.name ||
        task.assignee?.email ||
        "Не назначен";

      userMap.set(assigneeName, (userMap.get(assigneeName) ?? 0) + 1);

      if (
        task.deadline &&
        new Date(task.deadline) < new Date() &&
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

    return {
      statusData,
      userTasksData,
      overdueTasks,
      totalTasks: filteredTasks.length
    };
  }, [filteredTasks]);

  const handleClearFilters = () => {
    setSelectedWorkspace(null);
    setSelectedBoard(null);
  };

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <AnalyticsFilters
        workspaces={workspaces}
        boards={boards}
        selectedWorkspace={selectedWorkspace}
        selectedBoard={selectedBoard}
        onWorkspaceChange={setSelectedWorkspace}
        onBoardChange={setSelectedBoard}
        onClearFilters={handleClearFilters}
      />

      {/* Статистика */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-4 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              Количество задач по статусам
            </h2>
            <p className="text-xs text-muted-foreground">
              Всего задач: {analyticsData.totalTasks}
            </p>
          </div>
          <StatusChart data={analyticsData.statusData} />
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-4 text-sm">
          <h2 className="text-sm font-semibold">Просроченные задачи</h2>
          <p className="text-xs text-muted-foreground">
            Задачи с дедлайном в прошлом и статусом, отличным от DONE.
          </p>
          <div className="mt-2 max-h-64 space-y-2 overflow-auto pr-1 text-xs">
            {analyticsData.overdueTasks.length === 0 && (
              <p className="text-muted-foreground">
                Отлично! Просроченных задач нет.
              </p>
            )}
            {analyticsData.overdueTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-md border bg-muted/40 px-2 py-1.5"
              >
                <p className="font-medium">{task.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Дедлайн:{" "}
                  {new Date(task.deadline).toLocaleDateString("ru-RU", {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                  })}{" "}
                  · Доска: {task.board.name}
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
          <UserTasksChart data={analyticsData.userTasksData} />
        </div>
      </section>
    </div>
  );
}
