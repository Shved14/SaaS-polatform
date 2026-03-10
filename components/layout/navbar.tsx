 "use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Container } from "./container";
import { Button } from "@/components/ui/button";
import { KanbanSquare, Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export function Navbar({ session }: { session: Session | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <KanbanSquare className="h-5 w-5 text-sky-500" />
            <Link href="/" className="text-sm font-semibold tracking-tight">
              TaskFlow
            </Link>
          </div>
          <nav className="hidden items-center gap-2 text-xs md:flex md:text-sm">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/#benefits">Преимущества</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/#how-it-works">Как работает</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pricing">Тарифы</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/docs">Документация</Link>
            </Button>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border bg-card text-xs shadow-sm transition hover:bg-muted"
              aria-label="Переключить тему"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            {session?.user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/dashboard">Дашборд</Link>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setMobileOpen(false);
                    void signOut({ callbackUrl: "/" });
                  }}
                >
                  Выйти
                </Button>
              </>
            ) : (
              <Button size="sm" asChild>
                <Link href="/auth/signin">Войти</Link>
              </Button>
            )}
          </nav>
          <button
            type="button"
            aria-label="Открыть меню"
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </Container>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-background/95 md:hidden">
          <Container className="flex flex-col gap-4 pt-20 pb-6">
            <nav className="flex flex-col gap-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                asChild
                onClick={closeMobile}
              >
                <Link href="/#benefits">Преимущества</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                asChild
                onClick={closeMobile}
              >
                <Link href="/#how-it-works">Как работает</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                asChild
                onClick={closeMobile}
              >
                <Link href="/pricing">Тарифы</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start"
                asChild
                onClick={closeMobile}
              >
                <Link href="/docs">Документация</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 inline-flex items-center justify-start gap-2"
                type="button"
                onClick={() => {
                  toggleTheme();
                }}
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4" />
                    <span>Светлая тема</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    <span>Тёмная тема</span>
                  </>
                )}
              </Button>
              {session?.user && (
                <>
                  <div className="mt-2 h-px bg-border" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    asChild
                    onClick={closeMobile}
                  >
                    <Link href="/app/dashboard">Дашборд</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    asChild
                    onClick={closeMobile}
                  >
                    <Link href="/app/account">Профиль</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start"
                    asChild
                    onClick={closeMobile}
                  >
                    <Link href="/app/settings">Настройки</Link>
                  </Button>
                </>
              )}
            </nav>
            <div className="mt-auto pt-4">
              {session?.user ? (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    closeMobile();
                    void signOut({ callbackUrl: "/" });
                  }}
                >
                  Выйти
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  asChild
                  onClick={closeMobile}
                >
                  <Link href="/auth/signin">Войти</Link>
                </Button>
              )}
            </div>
          </Container>
        </div>
      )}
    </>
  );
}

