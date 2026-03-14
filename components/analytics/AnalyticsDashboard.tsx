"use client";

import { useEffect, useState } from "react";
import { ChartProgress, type ProgressData } from "./ChartProgress";
import { ChartActivity, type ActivityPoint } from "./ChartActivity";
import { ChartOverdue, type OverdueSlice } from "./ChartOverdue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, Clock, Users, RefreshCw, AlertCircle } from "lucide-react";

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
        label: "Tasks",
        completed: data.progress.completedTasks,
        total: data.progress.totalTasks
      }
    ]
    : [];

  const completionRate = data?.progress.totalTasks
    ? Math.round((data.progress.completedTasks / data.progress.totalTasks) * 100)
    : 0;

  const overdueCount = data?.overdueTasks.reduce((sum, task) => sum + task.count, 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Track your team's progress and performance
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Updated: {lastUpdated.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadAnalytics()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.progress.totalTasks ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              All tasks in workspace
            </p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.progress.completedTasks ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className={cn(
                "font-medium",
                completionRate >= 70 ? "text-green-600 dark:text-green-400" :
                  completionRate >= 40 ? "text-yellow-600 dark:text-yellow-400" :
                    "text-red-600 dark:text-red-400"
              )}>
                {completionRate}% completion rate
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Tasks past deadline
            </p>
          </CardContent>
        </Card>
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.activity.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Contributors this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Task Progress</CardTitle>
                <CardDescription>
                  Overall completion status
                </CardDescription>
              </div>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {completionRate}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ChartProgress data={progressChartData} />
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Overdue Tasks</CardTitle>
                <CardDescription>
                  Tasks that need immediate attention
                </CardDescription>
              </div>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {overdueCount}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ChartOverdue data={data?.overdueTasks ?? []} />
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Team Activity</CardTitle>
              <CardDescription>
                Daily task updates and contributions
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              Last 7 days
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ChartActivity data={data?.activity ?? []} />
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Updating analytics data...</span>
          </div>
        </div>
      )}
    </div>
  );
}

