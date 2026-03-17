"use client";

import Link from "next/link";
import type { Session } from "next-auth";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Container } from "./container";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KanbanSquare, Menu, MessageCircle, X, LogOut, LayoutDashboard, BarChart3 } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";

export function Navbar({ session }: { session: Session | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
  }

  const userInitials = session?.user?.name
    ? session.user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'U';

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/40 glass shadow-soft">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-soft group-hover:shadow-soft-lg transition-all duration-200 group-hover:scale-105">
                <KanbanSquare className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">TaskFlow</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" asChild className="hover-lift">
              <Link href="/#benefits">Преимущества</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hover-lift">
              <Link href="/#how-it-works">Как работает</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hover-lift">
              <Link href="/pricing">Тарифы</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hover-lift">
              <Link href="/docs">Документация</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hover-lift">
              <a
                href="https://t.me/+Vae4lrJUXxIzMTZk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5"
              >
                <MessageCircle className="h-4 w-4" />
                Связаться с нами
              </a>
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <NotificationSettings />
            <ThemeToggle />

            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full hover-lift">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm font-medium">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/app/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      <span>Панель управления</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => {
                      closeMobile();
                      void signOut({ callbackUrl: "/" });
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Выйти</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild className="hover-lift">
                <Link href="/auth/signin">Войти</Link>
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              aria-label="Open menu"
              className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <Container className="flex flex-col gap-4 pt-20 pb-6">
            <nav className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-12"
                asChild
                onClick={closeMobile}
              >
                <Link href="/#benefits">Преимущества</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-12"
                asChild
                onClick={closeMobile}
              >
                <Link href="/#how-it-works">Как работает</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-12"
                asChild
                onClick={closeMobile}
              >
                <Link href="/pricing">Тарифы</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-12"
                asChild
                onClick={closeMobile}
              >
                <Link href="/docs">Документация</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-12"
                asChild
                onClick={closeMobile}
              >
                <a
                  href="https://t.me/+Vae4lrJUXxIzMTZk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Связаться с нами в Telegram
                </a>
              </Button>

              {session?.user && (
                <>
                  <div className="my-2 h-px bg-border" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start h-12"
                    asChild
                    onClick={closeMobile}
                  >
                    <Link href="/app/dashboard">Панель управления</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start h-12"
                    asChild
                    onClick={closeMobile}
                  >
                    <Link href="/app/analytics">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Аналитика
                    </Link>
                  </Button>
                </>
              )}
            </nav>

            <div className="mt-auto pt-4 space-y-2">
              {session?.user ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full h-12"
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
                  className="w-full h-12"
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

