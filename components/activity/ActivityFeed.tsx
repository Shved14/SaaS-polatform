"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Clock,
  Filter,
  Search,
  Calendar,
  Activity,
  User,
  ArrowUpDown,
  RefreshCw
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  details: any;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

interface ActivityFeedProps {
  workspaceId: string;
  userId: string;
}

const actionColors = {
  created_task: "text-green-600 dark:text-green-400",
  updated_task: "text-blue-600 dark:text-blue-400",
  deleted_task: "text-red-600 dark:text-red-400",
  comment_added: "text-purple-600 dark:text-purple-400",
  status_changed: "text-orange-600 dark:text-orange-400",
  assigned_task: "text-cyan-600 dark:text-cyan-400",
  unassigned_task: "text-gray-600 dark:text-gray-400",
  created_board: "text-green-600 dark:text-green-400",
  updated_board: "text-blue-600 dark:text-blue-400",
  deleted_board: "text-red-600 dark:text-red-400",
  invited_user: "text-purple-600 dark:text-purple-400",
  joined_workspace: "text-green-600 dark:text-green-400",
  left_workspace: "text-orange-600 dark:text-orange-400"
};

const actionIcons = {
  created_task: "📝",
  updated_task: "✏️️",
  deleted_task: "🗑️️",
  comment_added: "💬",
  status_changed: "🔄",
  assigned_task: "👤",
  unassigned_task: "🚫",
  created_board: "📋",
  updated_board: "✏️️",
  deleted_board: "🗑️️",
  invited_user: "📨",
  joined_workspace: "🎉",
  left_workspace: "👋"
};

const entityTypeLabels = {
  task: "Задача",
  board: "Доска",
  workspace: "Workspace",
  comment: "Комментарий",
  user: "Пользователь"
};

export function ActivityFeed({ workspaceId, userId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<{
    limit: number;
    entityType: string;
    entityId: string;
    action: string;
  }>({
    limit: 20,
    entityType: "",
    entityId: "",
    action: ""
  });

  useEffect(() => {
    loadActivities();
  }, [workspaceId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filter.limit) params.set("limit", filter.limit.toString());
      if (filter.entityType) params.set("entityType", filter.entityType);
      if (filter.entityId) params.set("entityId", filter.entityId);
      if (filter.action) params.set("action", filter.action);
      if (workspaceId) params.set("workspaceId", workspaceId);

      const response = await fetch(`/api/activities?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "только что";
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    return `${diffDays} д назад`;
  };

  const getActionText = (activity: ActivityItem) => {
    const actionName = actionColors[activity.action as keyof typeof actionColors];
    const actionIcon = actionIcons[activity.action as keyof typeof actionIcons];
    const entityLabel = entityTypeLabels[activity.entityType as keyof typeof entityTypeLabels];

    let description = activity.description;

    // Добавляем дополнительную информацию для задач
    if (activity.entityType === "task" && activity.details) {
      const details = activity.details as any;
      if (details.newValue?.title) {
        description += `: "${details.newValue.title}"`;
      }
      if (details.oldValues?.title) {
        description += ` (было: "${details.oldValues.title}")`;
      }
    }

    return {
      color: actionName,
      icon: actionIcon,
      text: description,
      entity: entityLabel
    };
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
          <Button
            variant="ghost"
            size="sm"
            onClick={loadActivities}
            disabled={loading}
            className="ml-auto"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Фильтры */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Поиск действий..."
              value={filter.entityId}
              onChange={(e) => setFilter(prev => ({ ...prev, entityId: e.target.value }))}
              className="mb-2"
            />
            <Select
              value={filter.entityType}
              onValueChange={(value) => setFilter(prev => ({ ...prev, entityType: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Все сущности" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все сущности</SelectItem>
                <SelectItem value="task">Задачи</SelectItem>
                <SelectItem value="board">Доски</SelectItem>
                <SelectItem value="workspace">Workspace</SelectItem>
                <SelectItem value="comment">Комментарии</SelectItem>
                <SelectItem value="user">Пользователи</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Select
              value={filter.action}
              onValueChange={(value) => setFilter(prev => ({ ...prev, action: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Все действия" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Все действия</SelectItem>
                <SelectItem value="created_task">Создание</SelectItem>
                <SelectItem value="updated_task">Обновление</SelectItem>
                <SelectItem value="deleted_task">Удаление</SelectItem>
                <SelectItem value="comment_added">Комментарии</SelectItem>
                <SelectItem value="status_changed">Изменение статуса</SelectItem>
                <SelectItem value="assigned_task">Назначение</SelectItem>
                <SelectItem value="unassigned_task">Снятие назначения</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Лимит"
              value={filter.limit?.toString()}
              onChange={(e) => setFilter(prev => ({ ...prev, limit: parseInt(e.target.value) || 20 }))}
              min="1"
              max="100"
              className="w-32"
            />
          </div>
        </div>

        {/* Список активностей */}
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет активностей</p>
            </div>
          ) : (
            activities.map((activity) => {
              const actionInfo = getActionText(activity);

              return (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">
                        {activity.user.name?.[0] || activity.user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${actionInfo.color}`}>
                        {actionInfo.icon}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {actionInfo.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{formatTime(activity.createdAt)}</span>

                      {actionInfo.entity && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="ml-2">
                            {actionInfo.entity}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load more */}
        {activities.length >= filter.limit && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setFilter(prev => ({ ...prev, limit: (prev.limit || 20) + 20 }));
              }}
            >
              Загрузить еще
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
