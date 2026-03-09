"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateThemeAction } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";
import Link from "next/link";

type ThemeState = {
  primary?: string;
  background?: string;
  accentTodo?: string;
  accentInProgress?: string;
  accentReview?: string;
  accentDone?: string;
};

function parseTheme(json: string | null): ThemeState {
  if (!json) return {};
  try {
    const o = JSON.parse(json) as Record<string, string>;
    return {
      primary: o.primary ?? "#0ea5e9",
      background: o.background ?? "#ffffff",
      accentTodo: o.accentTodo ?? "#e5f0ff",
      accentInProgress: o.accentInProgress ?? "#fff4e5",
      accentReview: o.accentReview ?? "#f5e5ff",
      accentDone: o.accentDone ?? "#e5ffe9"
    };
  } catch {
    return {};
  }
}

export function ThemeSettings({
  plan,
  themeJson
}: {
  plan: string;
  themeJson: string | null;
}) {
  const theme = parseTheme(themeJson);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await updateThemeAction(formData);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  if (plan !== "PRO") {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Crown className="h-4 w-4 text-amber-500" />
          Кастомизация цветов дашборда
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Доступна на тарифе Pro. Выберите свои цвета для интерфейса.
        </p>
        <Button size="sm" className="mt-3" asChild>
          <Link href="/pricing">Перейти к тарифам</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Crown className="h-4 w-4 text-amber-500" />
        Цвета дашборда (Pro)
      </div>
      <p className="mt-1 mb-4 text-xs text-muted-foreground">
        Настройте основные цвета интерфейса и цвета фона колонок на доске.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Основной</span>
            <input
              type="color"
              name="primary"
              defaultValue={theme.primary ?? "#0ea5e9"}
              className="h-10 w-full cursor-pointer rounded border bg-background"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Фон</span>
            <input
              type="color"
              name="background"
              defaultValue={theme.background ?? "#ffffff"}
              className="h-10 w-full cursor-pointer rounded border bg-background"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Колонка TODO</span>
            <input
              type="color"
              name="accentTodo"
              defaultValue={theme.accentTodo ?? "#e5f0ff"}
              className="h-10 w-full cursor-pointer rounded border bg-background"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Колонка IN PROGRESS</span>
            <input
              type="color"
              name="accentInProgress"
              defaultValue={theme.accentInProgress ?? "#fff4e5"}
              className="h-10 w-full cursor-pointer rounded border bg-background"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Колонка REVIEW</span>
            <input
              type="color"
              name="accentReview"
              defaultValue={theme.accentReview ?? "#f5e5ff"}
              className="h-10 w-full cursor-pointer rounded border bg-background"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Колонка DONE</span>
            <input
              type="color"
              name="accentDone"
              defaultValue={theme.accentDone ?? "#e5ffe9"}
              className="h-10 w-full cursor-pointer rounded border bg-background"
            />
          </label>
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Сохранение…" : "Сохранить"}
        </Button>
      </form>
    </div>
  );
}
