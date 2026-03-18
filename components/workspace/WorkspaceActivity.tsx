"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  User,
  CheckCircle,
  Edit,
  MessageSquare,
  Trash2,
  Plus,
  Users,
  GitBranch,
  Clock
} from "lucide-react";

interface Activity {
  id: string;
  userId: string;
  action: string;
  entityId: string;
  entityType: string;
  description?: string;
  details?: any;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface WorkspaceActivityProps {
  workspaceId: string;
  activities: Activity[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

const actionIcons = {
  created_task: Plus,
  updated_task: Edit,
  deleted_task: Trash2,
  completed_task: CheckCircle,
  status_changed: GitBranch,
  comment_added: MessageSquare,
  added_comment: MessageSquare,
  assigned_task: User,
  unassigned_task: User,
  invited_user: Users,
  joined_workspace: Users,
  left_workspace: Users,
  created_board: Plus,
  updated_board: Edit,
  deleted_board: Trash2,
  moved_task: GitBranch,
};

const statusLabels: Record<string, string> = {
  TODO: "К выполнению",
  IN_PROGRESS: "В работе",
  REVIEW: "На проверке",
  DONE: "Готово",
};

const getActionDescription = (activity: Activity) => {
  // Используем описание из API если доступно
  if (activity.description) {
    return activity.description;
  }

  const d = activity.details || {};
  const title = d.newValue?.title || d.oldValues?.title || '';
  const name = d.newValue?.name || d.oldValues?.name || '';
  const entityName = title || name;

  switch (activity.action) {
    case 'created_task':
      return `создал(а) задачу «${entityName}»`;
    case 'updated_task': {
      const changes: string[] = [];
      if (d.newValue?.title && d.oldValues?.title && d.newValue.title !== d.oldValues.title) {
        changes.push(`название: «${d.newValue.title}»`);
      }
      if (d.newValue?.status) changes.push(`статус: ${statusLabels[d.newValue.status] || d.newValue.status}`);
      if (d.newValue?.priority) changes.push(`приоритет: ${d.newValue.priority}`);
      if (d.newValue?.assigneeId !== undefined) changes.push('исполнитель изменён');
      return changes.length > 0
        ? `обновил(а) задачу «${entityName}»: ${changes.join(', ')}`
        : `обновил(а) задачу «${entityName}»`;
    }
    case 'deleted_task':
      return `удалил(а) задачу «${entityName}»`;
    case 'status_changed': {
      const oldS = statusLabels[d.oldValues?.status] || d.oldValues?.status || '';
      const newS = statusLabels[d.newValue?.status] || d.newValue?.status || '';
      return `изменил(а) статус задачи «${entityName}»: ${oldS} → ${newS}`;
    }
    case 'assigned_task':
      return `назначил(а) задачу «${entityName}»` + (d.newValue?.assigneeName ? ` на ${d.newValue.assigneeName}` : '');
    case 'unassigned_task':
      return `снял(а) назначение с задачи «${entityName}»`;
    case 'comment_added':
    case 'added_comment':
      return `добавил(а) комментарий к задаче «${entityName}»`;
    case 'created_board':
      return `создал(а) доску «${entityName}»`;
    case 'updated_board':
      return `обновил(а) доску «${entityName}»`;
    case 'deleted_board':
      return `удалил(а) доску «${entityName}»`;
    case 'invited_user':
      return `пригласил(а) пользователя` + (d.metadata?.invitedUser ? ` ${d.metadata.invitedUser}` : '');
    case 'joined_workspace':
      return `присоединился(ась) к рабочему пространству «${entityName}»`;
    case 'left_workspace':
      return `покинул(а) рабочее пространство «${entityName}»`;
    default:
      return entityName ? `${activity.action} «${entityName}»` : activity.action;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return "только что";
  if (diffInMinutes < 60) return `${diffInMinutes} мин. назад`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ч. назад`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} д. назад`;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const getActionColor = (action: string) => {
  switch (action) {
    case "created_task":
    case "created_board":
      return "text-green-600 dark:text-green-400";
    case "updated_task":
    case "updated_board":
    case "moved_task":
      return "text-blue-600 dark:text-blue-400";
    case "completed_task":
      return "text-emerald-600 dark:text-emerald-400";
    case "status_changed":
      return "text-yellow-600 dark:text-yellow-400";
    case "deleted_task":
    case "deleted_board":
      return "text-red-600 dark:text-red-400";
    case "comment_added":
    case "added_comment":
      return "text-purple-600 dark:text-purple-400";
    case "assigned_task":
    case "unassigned_task":
      return "text-cyan-600 dark:text-cyan-400";
    case "invited_user":
    case "joined_workspace":
    case "left_workspace":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
};

export function WorkspaceActivity({
  workspaceId,
  activities,
  onLoadMore,
  hasMore = false,
  loading = false
}: WorkspaceActivityProps) {
  const [filter, setFilter] = useState<"all" | "tasks" | "boards" | "users">("all");

  const filteredActivities = activities.filter(activity => {
    switch (filter) {
      case "tasks":
        return activity.entityType === "task";
      case "boards":
        return activity.entityType === "board";
      case "users":
        return activity.entityType === "user" || activity.action.includes("user");
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Активность рабочего пространства
          </CardTitle>
          <CardDescription>
            История всех действий в рабочем пространстве
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Все
            </Button>
            <Button
              variant={filter === "tasks" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("tasks")}
            >
              Задачи
            </Button>
            <Button
              variant={filter === "boards" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("boards")}
            >
              Доски
            </Button>
            <Button
              variant={filter === "users" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("users")}
            >
              Пользователи
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Список активности */}
      <Card>
        <CardContent className="p-6">
          {loading && filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              Загрузка активности...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет активности</p>
              <p className="text-sm">
                {filter === "all"
                  ? "В этом рабочем пространстве еще нет активности"
                  : `Нет активности в категории "${filter === "tasks" ? "Задачи" : filter === "boards" ? "Доски" : "Пользователи"}"`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredActivities.map((activity, index) => {
                const Icon = actionIcons[activity.action as keyof typeof actionIcons] || Calendar;
                const actionColor = getActionColor(activity.action);

                return (
                  <div key={activity.id} className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${actionColor} bg-opacity-10`}>
                        <Icon className={`h-4 w-4 ${actionColor}`} />
                      </div>
                      {index < filteredActivities.length - 1 && (
                        <div className="w-0.5 h-16 bg-border mt-2"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-6">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-muted">
                            {activity.user.name?.[0] || activity.user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {activity.user.name || activity.user.email}
                            </span>
                            <span className={`text-sm ${actionColor}`}>
                              {getActionDescription(activity)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatTimeAgo(activity.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Кнопка загрузки еще */}
          {hasMore && !loading && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                ) : null}
                Загрузить еще
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
