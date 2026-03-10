"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";

interface BoardInviteButtonProps {
  boardId: string;
}

export function BoardInviteButton({ boardId }: BoardInviteButtonProps) {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId.trim()) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/boards/${boardId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId.trim() })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Не удалось отправить приглашение");
      }

      setMessage("Приглашение отправлено. Пользователь увидит его в уведомлениях.");
      setUserId("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Ошибка отправки приглашения"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen((v) => !v)}
      >
        Пригласить участника
      </Button>
      {open && (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xs space-y-2 rounded-md border bg-card p-3 text-xs shadow-sm"
        >
          <p className="text-[11px] text-muted-foreground">
            Введите <strong>ID пользователя</strong> (можно посмотреть в его
            профиле). Ему придёт приглашение в виде уведомления с кнопками
            «Принять» / «Отклонить».
          </p>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Например, clxyz..."
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" size="sm" disabled={loading || !userId}>
              {loading ? "Отправка..." : "Отправить"}
            </Button>
            {message && (
              <span className="text-[10px] text-emerald-500">{message}</span>
            )}
            {error && (
              <span className="text-[10px] text-red-500">{error}</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

