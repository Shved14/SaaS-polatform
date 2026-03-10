import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap } from "lucide-react";
import { PricingProButton } from "./pricing-pro-button";

export default async function PricingPage() {
  const session = await getServerSession(authOptions);
  let plan: string | null = null;
  let proUntil: Date | null = null;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, proUntil: true }
    });
    if (user) {
      plan = user.plan ?? "FREE";
      proUntil = user.proUntil ?? null;
    }
  }

  const now = new Date();
  const isProActive =
    plan === "PRO" && proUntil && proUntil.getTime() > now.getTime();
  return (
    <main className="min-h-[calc(100vh-4rem)] py-12">
      <Container className="max-w-4xl space-y-10">
        <div className="text-center">
          <h1 className="text-2xl font-semibold md:text-3xl">Тарифы</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Выберите подходящий план для вашей команды
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-sky-500" />
              <h2 className="text-lg font-semibold">Бесплатный</h2>
            </div>
            <p className="mt-1 text-2xl font-bold">0 ₽</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Для небольших команд и личных проектов
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                До 3 досок в workspace
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Drag & drop, дедлайны, приоритеты
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Приглашение участников по ссылке
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Базовая аналитика
              </li>
            </ul>
            {session?.user ? (
              <Button variant="outline" className="mt-6 w-full" disabled>
                Активно
              </Button>
            ) : (
              <Button variant="outline" className="mt-6 w-full" asChild>
                <Link href="/auth/signin">Начать бесплатно</Link>
              </Button>
            )}
          </div>

          {/* Pro */}
          <div className="rounded-2xl border-2 border-primary bg-card p-6 shadow-md">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Pro</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Рекомендуем
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold">499 ₽/мес</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Кастомизация и расширенные возможности
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Всё из тарифа Бесплатный
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Без ограничения числа досок
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                <strong>Кастомизация цветов дашборда</strong> — свой основной цвет, фон и акцент
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Расширенная аналитика
              </li>
            </ul>
            {session?.user ? (
              <>
                <PricingProButton
                  isActive={!!isProActive}
                  activeUntil={isProActive ? proUntil : null}
                />
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Демо: включите Pro без оплаты.
                </p>
              </>
            ) : (
              <>
                <Button className="mt-6 w-full" asChild>
                  <Link href="/auth/signin">Оформить Pro</Link>
                </Button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  После входа можно включить Pro (демо-режим).
                </p>
              </>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
