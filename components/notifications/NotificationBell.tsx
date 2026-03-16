"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NotificationItem = {
  id: string;
  type: string;
  data: any;
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

  async function handleInviteAction(id: string, action: "accept" | "decline") {
    await fetch("/api/notifications/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    });
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  async function handleWorkspaceInviteAction(notificationId: string, invitationId: string, action: "accept" | "decline") {
    try {
      console.log(`Handling workspace invitation: ${invitationId}, action: ${action}`);

      const res = await fetch("/api/user/invitations", {
        method: action === "accept" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId })
      });

      console.log(`Response status: ${res.status}`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`API error: ${res.status} - ${errorText}`);
        alert(`Ошибка при обработке приглашения: ${res.status}`);
        return;
      }

      const data = await res.json();
      console.log("Invitation response:", data);

      // Mark notification as read in database
      await markRead(notificationId);

      // Also update local state immediately for better UX
      setItems((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );

      if (action === "accept" && data.workspaceId) {
        // Redirect to workspace
        console.log(`Redirecting to workspace: ${data.workspaceId}`);
        window.location.href = `/app/workspace/${data.workspaceId}`;
      }
    } catch (error) {
      console.error("Error handling invitation:", error);
      alert("Ошибка при обработке приглашения. Попробуйте еще раз.");
    }
  }

  function renderText(n: NotificationItem) {
    const d = n.data ?? {};
    if (n.type === "TASK_CREATED") {
      return `Новая задача «${d.title ?? ""}» на доске «${d.boardName ?? ""}»`;
    }
    if (n.type === "BOARD_INVITE") {
      return `Приглашение на доску «${d.boardName ?? ""}» в workspace «${d.workspaceName ?? ""
        }»`;
    }
    if (n.type === "WORKSPACE_INVITATION") {
      return `Вас пригласили присоединиться к «${d.workspaceName ?? ""}»`;
    }
    return "Новое уведомление";
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
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border bg-card p-2 text-xs shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold">Уведомления</span>
            {loading && (
              <span className="text-[10px] text-muted-foreground">
                Обновляем...
              </span>
            )}
          </div>
          {items.length === 0 && (
            <p className="px-1 py-2 text-muted-foreground">
              У вас пока нет уведомлений.
            </p>
          )}
          <div className="max-h-80 space-y-1 overflow-auto pr-1">
            {items.map((n) => {
              const created = new Date(n.createdAt).toLocaleString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
              });
              const isInvite = n.type === "BOARD_INVITE" || n.type === "WORKSPACE_INVITATION";
              const isWorkspaceInvite = n.type === "WORKSPACE_INVITATION";
              return (
                <div
                  key={n.id}
                  className={cn(
                    "rounded-md border px-2 py-1.5",
                    n.isRead
                      ? "border-border bg-muted/40"
                      : "border-sky-500/40 bg-sky-500/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px]">{renderText(n)}</p>
                    {!n.isRead && !isInvite && (
                      <button
                        type="button"
                        onClick={() => void markRead(n.id)}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Прочитано
                      </button>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {created}
                    </span>
                    {isInvite && !n.isRead && (
                      <div className="flex gap-1">
                        {isWorkspaceInvite ? (
                          <>
                            <Button
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => void handleWorkspaceInviteAction(n.id, n.data.invitationId, "accept")}
                            >
                              Принять
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => void handleWorkspaceInviteAction(n.id, n.data.invitationId, "decline")}
                            >
                              Отклонить
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => void handleInviteAction(n.id, "accept")}
                            >
                              Принять
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[10px]"
                              onClick={() =>
                                void handleInviteAction(n.id, "decline")
                              }
                            >
                              Отклонить
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

