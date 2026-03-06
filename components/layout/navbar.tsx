import Link from "next/link";
import { Container } from "./container";
import { Button } from "@/components/ui/button";
import { KanbanSquare } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <KanbanSquare className="h-5 w-5 text-sky-500" />
          <Link href="/" className="text-sm font-semibold tracking-tight">
            TaskFlow
          </Link>
        </div>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pricing">Тарифы</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/docs">Документация</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/signin">Войти</Link>
          </Button>
        </nav>
      </Container>
    </header>
  );
}

