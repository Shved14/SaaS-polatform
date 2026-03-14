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
import { KanbanSquare, Menu, X, User, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";

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
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <KanbanSquare className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold">TaskFlow</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" asChild className="hover-lift">
              <Link href="/#benefits">Benefits</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hover-lift">
              <Link href="/#how-it-works">How it works</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hover-lift">
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hover-lift">
              <Link href="/docs">Documentation</Link>
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            <NotificationBell />
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
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/account" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/settings" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
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
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild className="hover-lift">
                <Link href="/auth/signin">Sign in</Link>
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
                <Link href="/#benefits">Benefits</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-12"
                asChild
                onClick={closeMobile}
              >
                <Link href="/#how-it-works">How it works</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-12"
                asChild
                onClick={closeMobile}
              >
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start h-12"
                asChild
                onClick={closeMobile}
              >
                <Link href="/docs">Documentation</Link>
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
                    <Link href="/app/dashboard">Dashboard</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start h-12"
                    asChild
                    onClick={closeMobile}
                  >
                    <Link href="/app/account">Profile</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start h-12"
                    asChild
                    onClick={closeMobile}
                  >
                    <Link href="/app/settings">Settings</Link>
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
                  Log out
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full h-12"
                  asChild
                  onClick={closeMobile}
                >
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
              )}
            </div>
          </Container>
        </div>
      )}
    </>
  );
}

