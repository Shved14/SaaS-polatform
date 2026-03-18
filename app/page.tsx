"use client";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import {
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
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/20 px-3 py-1 text-xs font-medium text-primary shadow-soft border border-primary/20">
              <Sparkles className="h-3 w-3" />
              Новая платформа для управления задачами
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
              Современный{" "}
              <span className="gradient-text">
                Kanban для команд
              </span>{" "}
              любого размера.
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base leading-relaxed">
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
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Реальное drag & drop на базе dnd-kit
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Аутентификация через email, Google, GitHub
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl gradient-bg opacity-10 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-card/80 p-4 shadow-soft-2xl backdrop-blur-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <KanbanSquare className="h-4 w-4 text-primary" />
                  Доска задач · Запуск Q2
                </div>
                <span className="rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-2 py-0.5 text-[10px] font-medium text-white shadow-soft">
                  Превью
                </span>
              </div>
              <div className="grid gap-3 text-[11px] md:grid-cols-4">
                <div className="space-y-2 rounded-2xl bg-gradient-to-br from-red-50/80 to-red-100/40 dark:from-red-900/20 dark:to-red-800/10 p-3 border border-red-200/50 dark:border-red-800/30">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                    К ВЫПОЛНЕНИЮ
                  </p>
                  <div className="space-y-1.5">
                    <div className="rounded-md bg-background/90 p-2 shadow-soft border border-border/50">
                      Дизайн лендинга
                    </div>
                    <div className="rounded-md bg-background/90 p-2 shadow-soft border border-border/50">
                      Настроить аналитику
                    </div>
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl bg-gradient-to-br from-yellow-50/80 to-yellow-100/40 dark:from-yellow-900/20 dark:to-yellow-800/10 p-3 border border-yellow-200/50 dark:border-yellow-800/30">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-300">
                    В РАБОТЕ
                  </p>
                  <div className="space-y-1.5">
                    <div className="rounded-md bg-background/90 p-2 shadow-soft border border-border/50">
                      Аутентификация и рабочие пространства
                    </div>
                    <div className="rounded-md bg-background/90 p-2 shadow-soft border border-border/50">
                      Drag & drop доска
                    </div>
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl bg-gradient-to-br from-blue-50/80 to-blue-100/40 dark:from-blue-900/20 dark:to-blue-800/10 p-3 border border-blue-200/50 dark:border-blue-800/30">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    НА ПРОВЕРКЕ
                  </p>
                  <div className="space-y-1.5">
                    <div className="rounded-md bg-background/90 p-2 shadow-soft border border-border/50">
                      UX сценарий онбординга
                    </div>
                    <div className="rounded-md bg-background/90 p-2 shadow-soft border border-border/50">
                      Проверка пермишенов
                    </div>
                  </div>
                </div>
                <div className="space-y-2 rounded-2xl bg-gradient-to-br from-green-50/80 to-green-100/40 dark:from-green-900/20 dark:to-green-800/10 p-3 border border-green-200/50 dark:border-green-800/30">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
                    ГОТОВО
                  </p>
                  <div className="space-y-1.5">
                    <div className="rounded-md bg-background/90 p-2 shadow-soft border border-border/50">
                      Базовая архитектура
                    </div>
                    <div className="rounded-md bg-background/90 p-2 shadow-soft border border-border/50">
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
        <section className="rounded-3xl border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 px-6 py-8 text-center shadow-soft-lg md:px-10 backdrop-blur-sm">
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
                href="https://t.me/+Vae4lrJUXxIzMTZk"
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
    <div className="flex flex-col gap-3 rounded-2xl border bg-card/80 p-4 text-sm shadow-soft hover:shadow-soft-lg transition-all duration-200 hover:-translate-y-1 backdrop-blur-sm">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-primary/10 to-primary/20 text-primary shadow-soft">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
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
    <div className="flex flex-col gap-3 rounded-2xl border bg-card/80 p-4 text-sm shadow-soft hover:shadow-soft-lg transition-all duration-200 hover:-translate-y-1 backdrop-blur-sm">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-primary/10 to-primary/20 text-[11px] font-medium text-primary shadow-soft">
        {step}
      </span>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

