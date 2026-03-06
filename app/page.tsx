"use client";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ArrowRight, KanbanSquare, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <Container className="flex min-h-[calc(100vh-4rem)] flex-col justify-center gap-16 py-12">
      <section className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Sparkles className="h-3 w-3" />
            Новый SaaS для командной работы
          </div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
            Управляйте задачами, как{" "}
            <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
              в Trello
            </span>
            , но лучше.
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Создавайте доски, списки и карточки. Перетаскивайте задачи между
            колонками с помощью drag & drop. Отслеживайте прогресс команды в
            режиме реального времени.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg" asChild>
              <Link href="/app">
                Начать бесплатно
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Посмотреть возможности</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Бесплатный тариф для небольших команд. Без необходимости вводить
            карту.
          </p>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-purple-500/10 blur-3xl" />
          <div className="relative rounded-3xl border bg-card/40 p-4 shadow-lg backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <KanbanSquare className="h-4 w-4 text-sky-500" />
                Доска: Разработка продукта
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                Активно
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Backlog
                </p>
                <div className="space-y-2 text-xs">
                  <div className="rounded-md bg-background p-2 shadow-sm">
                    Исследовать потребности пользователей
                  </div>
                  <div className="rounded-md bg-background p-2 shadow-sm">
                    Спроектировать архитектуру
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  В работе
                </p>
                <div className="space-y-2 text-xs">
                  <div className="rounded-md bg-background p-2 shadow-sm">
                    Реализовать drag & drop
                  </div>
                  <div className="rounded-md bg-background p-2 shadow-sm">
                    Настроить аутентификацию
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Готово
                </p>
                <div className="space-y-2 text-xs">
                  <div className="rounded-md bg-background p-2 shadow-sm">
                    Базовый UI и навигация
                  </div>
                  <div className="rounded-md bg-background p-2 shadow-sm">
                    Landing page
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="grid gap-8 md:grid-cols-3">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Доски, списки, карточки</h2>
          <p className="text-sm text-muted-foreground">
            Организуйте задачи по проектам, этапам и приоритетам в гибкой
            структуре, знакомой пользователям Trello.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Drag & Drop с dnd-kit</h2>
          <p className="text-sm text-muted-foreground">
            Современный и плавный опыт перетаскивания карточек между колонками и
            списками.
          </p>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Готово для продакшена</h2>
          <p className="text-sm text-muted-foreground">
            Next.js 14 App Router, Prisma + PostgreSQL, NextAuth, Resend — всё
            готово для запуска SaaS-платформы.
          </p>
        </div>
      </section>
    </Container>
  );
}

