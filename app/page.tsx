"use client";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  KanbanSquare,
  MessageCircle,
  Sparkles,
  Users,
  Zap
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { LandingAuthButtons } from "@/components/landing-auth-buttons";

export default function LandingPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background">
      <Container className="flex flex-col gap-24 py-12 md:py-16">
        {/* Hero */}
        <section className="grid items-center gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground shadow-sm">
              <Sparkles className="h-3 w-3" />
              Новая платформа для управления задачами
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
              Современный{" "}
              <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                Kanban для команд
              </span>{" "}
              любого размера.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              Организуйте проекты, управляйте дедлайнами и синхронизируйте
              команду в одном месте. Drag & drop доски, рабочие пространства и
              продуманная аналитика — всё из коробки.
            </p>
            <LandingAuthButtons />
            <p className="text-xs text-muted-foreground">
              Бесплатный тариф для небольших команд. Без карты, без долгой
              настройки.
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Реальное drag & drop на базе dnd-kit
              </div>
              <div className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Аутентификация через email, Google, Telegram
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-purple-500/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border bg-card/60 p-4 shadow-xl backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <KanbanSquare className="h-4 w-4 text-sky-500" />
                  Sprint board · Q2 Launch
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  Live preview
                </span>
              </div>
              <div className="grid gap-3 text-[11px] md:grid-cols-4">
                <div className="space-y-2 rounded-2xl bg-muted/70 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    TODO
                  </p>
                  <div className="space-y-1.5">
                    <div className="rounded-md bg-background p-2 shadow-sm">
                      Дизайн лендинга
                    </div>
                    <div className="rounded-md bg-background p-2 shadow-sm">
                      Настроить аналитику
                    </div>
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl bg-muted/70 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    In progress
                  </p>
                  <div className="space-y-1.5">
                    <div className="rounded-md bg-background p-2 shadow-sm">
                      Auth & рабочие пространства
                    </div>
                    <div className="rounded-md bg-background p-2 shadow-sm">
                      Drag & drop доска
                    </div>
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl bg-muted/70 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Review
                  </p>
                  <div className="space-y-1.5">
                    <div className="rounded-md bg-background p-2 shadow-sm">
                      UX сценарий онбординга
                    </div>
                    <div className="rounded-md bg-background p-2 shadow-sm">
                      Проверка пермишенов
                    </div>
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl bg-muted/70 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Done
                  </p>
                  <div className="space-y-1.5">
                    <div className="rounded-md bg-background p-2 shadow-sm">
                      Базовая архитектура
                    </div>
                    <div className="rounded-md bg-background p-2 shadow-sm">
                      Настроенный CI/CD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Преимущества */}
        <section id="benefits" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              Почему команды выбирают TaskFlow
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Меньше хаоса в чатах, больше прозрачности в задачах. Наш продукт
              помогает держать под контролем дедлайны, загрузку команды и ход
              проектов.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <BenefitCard
              icon={Zap}
              title="Быстрая организация проектов"
              description="Быстро создавайте доски, списки и задачи. Перетаскивайте карточки между колонками без перезагрузки."
            />
            <BenefitCard
              icon={Users}
              title="Командная работа"
              description="Рабочие пространства для команд, роли участников и прозрачное распределение ответственности."
            />
            <BenefitCard
              icon={BarChart3}
              title="Умная аналитика"
              description="Отслеживайте прогресс по статусам, загруженность команд и узкие места в процессах."
            />
            <BenefitCard
              icon={CalendarClock}
              title="Отслеживание дедлайнов"
              description="Дедлайны по задачам, приоритеты и фокус на том, что действительно важно прямо сейчас."
            />
          </div>
        </section>

        {/* Как работает */}
        <section id="how-it-works" className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              Как это работает
            </h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Всего несколько шагов, чтобы навести порядок в задачах и сделать
              прогресс команды прозрачным.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <HowStep
              step="01"
              title="Создайте workspace"
              description="Соберите команду в одном рабочем пространстве. Пригласите коллег по ссылке."
            />
            <HowStep
              step="02"
              title="Настройте доски"
              description="Создайте Kanban-доски по проектам и разделите задачи по статусам и приоритетам."
            />
            <HowStep
              step="03"
              title="Работайте визуально"
              description="Перетаскивайте задачи между колонками, назначайте исполнителей и следите за дедлайнами."
            />
          </div>
        </section>

        {/* CTA блок */}
        <section className="rounded-3xl border bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-500/10 px-6 py-8 text-center shadow-sm md:px-10">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
            Готовы вывести управление задачами на новый уровень?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Зарегистрируйтесь за 30 секунд и начните работать с командой в
            едином пространстве уже сегодня.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <LandingAuthButtons />
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} TaskFlow. Все права защищены.</p>
          <div className="flex gap-4">
            <Link href="/docs" className="hover:text-foreground">
              Документация
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              Тарифы
            </Link>
            <Button variant="ghost" size="sm" asChild className="h-auto p-0 text-xs hover:text-foreground">
              <a
                href="https://t.me/SelfC0NTR0L"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Telegram
              </a>
            </Button>
          </div>
        </footer>
      </Container>
    </main>
  );
}

interface BenefitCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function BenefitCard({ icon: Icon, title, description }: BenefitCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 text-sm shadow-sm">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

interface HowStepProps {
  step: string;
  title: string;
  description: string;
}

function HowStep({ step, title, description }: HowStepProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 text-sm">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
        {step}
      </span>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

