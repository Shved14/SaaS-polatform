import { Container } from "@/components/layout/container";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocsPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] py-12">
      <Container className="max-w-3xl space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Документация</h1>
            <p className="text-sm text-muted-foreground">
              Руководство по использованию TaskFlow
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="text-lg font-medium">Быстрый старт</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Зарегистрируйтесь или войдите через email, Google или Telegram.</li>
            <li>Создайте рабочее пространство (Workspace) в разделе «Доски».</li>
            <li>В workspace создайте доску и добавляйте задачи в колонки TODO, IN PROGRESS, REVIEW, DONE.</li>
            <li>Перетаскивайте карточки между колонками, назначайте исполнителей и задавайте дедлайны.</li>
          </ol>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="text-lg font-medium">Тариф Pro</h2>
          <p className="text-sm text-muted-foreground">
            На тарифе Pro в разделе «Настройки» доступна кастомизация цветов дашборда: основной цвет, фон и акцент. 
            Изменения применяются ко всем доскам и интерфейсу приложения.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/pricing">
              Тарифы
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="text-lg font-medium">Поддержка</h2>
          <p className="text-sm text-muted-foreground">
            По вопросам работы платформы обращайтесь в поддержку или изучите раздел «Как это работает» на главной странице.
          </p>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#how-it-works">Как это работает</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
