"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Settings,
  User,
  BarChart3,
  Plus,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const navigation = [
  {
    name: "Панель управления",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    current: false,
  },
  {
    name: "Аналитика",
    href: "/app/analytics",
    icon: BarChart3,
    current: false,
    badge: "Новое",
  },
  {
    name: "Профиль",
    href: "/app/account",
    icon: User,
    current: false,
  },
  {
    name: "Настройки",
    href: "/app/settings",
    icon: Settings,
    current: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r border-border/60 bg-background/95 backdrop-blur-sm md:flex md:flex-col shadow-soft-lg">
      <div className="flex flex-col gap-y-5 p-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            className="pl-10 h-9 bg-muted/50 border-0 focus:bg-background"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="default" size="sm" className="flex-1 gap-2 shadow-soft hover:shadow-soft-lg transition-all duration-200 hover:scale-105">
            <Plus className="h-4 w-4" />
            Создать
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-soft"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge
                        variant={isActive ? "secondary" : "outline"}
                        className="h-5 px-1.5 text-[10px]"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

      </div>
    </aside>
  );
}

