"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
};

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = items.filter((n) => !n.isRead).length;

  async function loadNotifications() {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: NotificationItem[] = await res.json();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
    // Realtime обновления каждые 30 секунд
    const timer = setInterval(() => {
      void loadNotifications();
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] })
    });
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  async function markAllRead() {
    await fetch("/api/notifications/read", {
      method: "PUT"
    });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function handleWorkspaceInviteAction(notificationId: string, invitationId: string, action: "accept" | "decline") {
    try {
      const res = await fetch("/api/invitations", {
        method: action === "accept" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationToken: invitationId })
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API error: ${res.status} - ${errorText}`);
        alert(`Ошибка при обработке приглашения: ${res.status}`);
        return;
      }

      const data = await res.json();
      await markRead(notificationId);

      if (action === "accept" && data.workspaceId) {
        window.location.href = `/app/workspace/${data.workspaceId}`;
      }
    } catch (error) {
      console.error("Error handling invitation:", error);
      alert("Ошибка при обработке приглашения. Попробуйте еще раз.");
    }
  }

  // Обработка клика по уведомлению для навигации
  function handleNotificationClick(notification: NotificationItem) {
    if (!notification.isRead) {
      void markRead(notification.id);
    }

    const data = notification.data;
    if (!data) return;

    // Навигация в зависимости от типа уведомления
    switch (data.type) {
      case "task_assigned":
      case "task_comment":
      case "task_deadline_today":
      case "task_overdue":
      case "task_created":
        if (data.taskId && data.boardId && data.workspaceId) {
          window.location.href = `/app/board/${data.boardId}?task=${data.taskId}`;
        }
        break;
      case "workspace_invitation":
        // Приглашения обрабатываются через кнопки
        break;
      default:
        // По умолчанию переходим в workspace
        if (data.workspaceId) {
          window.location.href = `/app/workspace/${data.workspaceId}`;
        }
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "WORKSPACE_INVITATION":
        return "👥";
      case "TASK_ASSIGNED":
        return "📋";
      case "TASK_COMMENT_ADDED":
        return "💬";
      case "TASK_DEADLINE_TODAY":
        return "⏰";
      case "TASK_OVERDUE":
        return "🚨";
      case "TASK_CREATED":
        return "✨";
      default:
        return "🔔";
    }
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border bg-card text-xs shadow-sm transition hover:bg-muted"
        aria-label="Уведомления"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-lg border bg-card p-3 text-xs shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-sm">Уведомления</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => void markAllRead()}
                >
                  Все прочитано
                </Button>
              )}
              {loading && (
                <span className="text-[10px] text-muted-foreground">
                  Обновляем...
                </span>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <p className="px-2 py-4 text-center text-muted-foreground">
              У вас пока нет уведомлений.
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-auto pr-1">
              {items.map((n) => {
                const created = new Date(n.createdAt).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                const isWorkspaceInvite = n.type === "WORKSPACE_INVITATION";

                return (
                  <div
                    key={n.id}
                    className={cn(
                      "rounded-lg border p-3 transition-all cursor-pointer hover:shadow-md",
                      n.isRead
                        ? "border-border bg-muted/30"
                        : "border-primary/30 bg-primary/5"
                    )}
                    onClick={() => !isWorkspaceInvite && handleNotificationClick(n)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getNotificationIcon(n.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm truncate">{n.title}</h4>
                          {!n.isRead && !isWorkspaceInvite && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void markRead(n.id);
                              }}
                              className="text-[10px] text-muted-foreground hover:text-foreground flex-shrink-0"
                            >
                              Прочитано
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground">
                            {created}
                          </span>
                          {isWorkspaceInvite && !n.isRead && n.data?.invitationToken && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                className="h-6 px-2 text-[10px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleWorkspaceInviteAction(n.id, n.data.invitationToken, "accept");
                                }}
                              >
                                Принять
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-[10px]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleWorkspaceInviteAction(n.id, n.data.invitationToken, "decline");
                                }}
                              >
                                Отклонить
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

