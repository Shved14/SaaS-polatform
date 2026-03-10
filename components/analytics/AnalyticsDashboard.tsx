"use client";

import { useEffect, useState } from "react";
import { ChartProgress, type ProgressData } from "./ChartProgress";
import { ChartActivity, type ActivityPoint } from "./ChartActivity";
import { ChartOverdue, type OverdueSlice } from "./ChartOverdue";
import { Button } from "@/components/ui/button";

interface AnalyticsResponse {
  progress: {
    totalTasks: number;
    completedTasks: number;
  };
  activity: ActivityPoint[];
  overdueTasks: OverdueSlice[];
}

interface AnalyticsDashboardProps {
  workspaceId: string;
}

export function AnalyticsDashboard({ workspaceId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/analytics/${workspaceId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Не удалось загрузить аналитику");
      }
      const json: AnalyticsResponse = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Ошибка загрузки аналитики"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
    const timer = setInterval(() => {
      void loadAnalytics();
    }, 30_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const progressChartData: ProgressData[] = data
    ? [
        {
          label: "Задачи",
          completed: data.progress.completedTasks,
          total: data.progress.totalTasks
        }
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Аналитика workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Прогресс задач, активность участников и просроченные задачи.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {lastUpdated && (
            <span>
              Обновлено:{" "}
              {lastUpdated.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </span>
          )}
          <Button size="sm" variant="outline" onClick={() => void loadAnalytics()}>
            Обновить
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Прогресс задач</h2>
            <p className="text-xs text-muted-foreground">
              Завершено{" "}
              <span className="font-medium">
                {data?.progress.completedTasks ?? 0}
              </span>{" "}
              из{" "}
              <span className="font-medium">
                {data?.progress.totalTasks ?? 0}
              </span>
            </p>
          </div>
          <ChartProgress data={progressChartData} />
        </section>

        <section className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Просроченные задачи</h2>
            <p className="text-xs text-muted-foreground">
              Задачи с дедлайном в прошлом и статусом, отличным от DONE.
            </p>
          </div>
          <ChartOverdue data={data?.overdueTasks ?? []} />
        </section>
      </div>

      <section className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Активность участников</h2>
          <p className="text-xs text-muted-foreground">
            Количество изменений задач по дням.
          </p>
        </div>
        <ChartActivity data={data?.activity ?? []} />
      </section>

      {loading && (
        <p className="text-xs text-muted-foreground">Обновляем данные...</p>
      )}
    </div>
  );
}

