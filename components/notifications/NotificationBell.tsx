"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Settings, Trash2, X } from "lucide-react";
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((n) => !n.isRead).length;
  const filteredItems = filter === "unread" ? items.filter((n) => !n.isRead) : items;

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: NotificationItem[] = await res.json();
      setItems(data);
    } catch {
      // Silently fail for unauthenticated users
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
    const timer = setInterval(() => void loadNotifications(), 30_000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

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
    await fetch("/api/notifications/read", { method: "PUT" });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function clearAllRead() {
    const readIds = items.filter((n) => n.isRead).map((n) => n.id);
    if (readIds.length === 0) return;
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: readIds })
    });
    setItems((prev) => prev.filter((n) => !n.isRead));
  }

  async function deleteNotification(id: string) {
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] })
    });
    setItems((prev) => prev.filter((n) => n.id !== id));
  }

  async function handleWorkspaceInviteAction(notificationId: string, invitationId: string, action: "accept" | "decline") {
    try {
      const res = await fetch("/api/invitations", {
        method: action === "accept" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationToken: invitationId })
      });

      if (!res.ok) {
        console.error(`Invitation API error: ${res.status}`);
        return;
      }

      const data = await res.json();
      await markRead(notificationId);

      if (action === "accept" && data.workspaceId) {
        setOpen(false);
        router.push(`/app/workspace/${data.workspaceId}`);
      }
    } catch (error) {
      console.error("Error handling invitation:", error);
    }
  }

  function handleNotificationClick(notification: NotificationItem) {
    if (!notification.isRead) {
      void markRead(notification.id);
    }

    const data = notification.data;
    if (!data) return;

    setOpen(false);

    switch (data.type) {
      case "task_assigned":
      case "task_comment":
      case "task_deadline_today":
      case "task_overdue":
      case "task_created":
        if (data.boardId) {
          router.push(`/app/board/${data.boardId}${data.taskId ? `?task=${data.taskId}` : ""}`);
        }
        break;
      case "workspace_invitation":
        break;
      default:
        if (data.workspaceId) {
          router.push(`/app/workspace/${data.workspaceId}`);
        }
    }
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case "WORKSPACE_INVITATION": return "👥";
      case "TASK_ASSIGNED": return "📋";
      case "TASK_COMMENT_ADDED": return "💬";
      case "TASK_DEADLINE_TODAY": return "⏰";
      case "TASK_OVERDUE": return "🚨";
      case "TASK_CREATED": return "✨";
      case "TASK_UPDATED": return "✏️";
      case "TASK_STATUS_CHANGED": return "🔄";
      case "TASK_DELETED": return "🗑️";
      default: return "🔔";
    }
  }

  function timeAgo(dateStr: string) {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "только что";
    if (mins < 60) return `${mins} мин. назад`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ч. назад`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} дн. назад`;
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border bg-card text-xs shadow-sm transition hover:bg-muted"
        aria-label="Уведомления"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[400px] rounded-xl border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-semibold text-sm">Уведомления</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => void markAllRead()}
                  title="Прочитать все"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                </Button>
              )}
              {items.some((n) => n.isRead) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-destructive"
                  onClick={() => void clearAllRead()}
                  title="Очистить прочитанные"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => {
                  setOpen(false);
                  router.push("/app/settings/notifications");
                }}
                title="Настройки"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex border-b px-4">
            <button
              className={cn(
                "px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                filter === "all"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setFilter("all")}
            >
              Все ({items.length})
            </button>
            <button
              className={cn(
                "px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                filter === "unread"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setFilter("unread")}
            >
              Непрочитанные ({unreadCount})
            </button>
          </div>

          {/* Notification list */}
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {filter === "unread" ? "Нет непрочитанных уведомлений" : "У вас пока нет уведомлений"}
              </p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {filteredItems.map((n) => {
                const isWorkspaceInvite = n.type === "WORKSPACE_INVITATION";

                return (
                  <div
                    key={n.id}
                    className={cn(
                      "group flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer",
                      n.isRead
                        ? "hover:bg-muted/50"
                        : "bg-primary/5 hover:bg-primary/10"
                    )}
                    onClick={() => !isWorkspaceInvite && handleNotificationClick(n)}
                  >
                    {/* Icon */}
                    <span className="text-base mt-0.5 flex-shrink-0">{getNotificationIcon(n.type)}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          "text-sm truncate",
                          n.isRead ? "font-normal" : "font-semibold"
                        )}>
                          {n.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.isRead && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); void markRead(n.id); }}
                              className="p-0.5 rounded hover:bg-muted"
                              title="Прочитано"
                            >
                              <Check className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); void deleteNotification(n.id); }}
                            className="p-0.5 rounded hover:bg-muted"
                            title="Удалить"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </span>

                        {isWorkspaceInvite && !n.isRead && n.data?.invitationToken && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="h-6 px-2.5 text-[10px]"
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
                              className="h-6 px-2.5 text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleWorkspaceInviteAction(n.id, n.data.invitationToken, "decline");
                              }}
                            >
                              Отклонить
                            </Button>
                          </div>
                        )}

                        {!n.isRead && !isWorkspaceInvite && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer with loading indicator */}
          {loading && (
            <div className="border-t px-4 py-2 text-center">
              <span className="text-[10px] text-muted-foreground">Обновление...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
