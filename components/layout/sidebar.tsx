import Link from "next/link";
import { KanbanSquare, LayoutDashboard, Settings, User } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="hidden w-60 border-r bg-card/60 px-4 py-4 md:block">
      <div className="mb-6 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <KanbanSquare className="h-4 w-4" />
        <span>Рабочее пространство</span>
      </div>
      <nav className="space-y-1 text-sm">
        <Link
          href="/app"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Доски</span>
        </Link>
        <Link
          href="/account"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <User className="h-4 w-4" />
          <span>Профиль</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          <span>Настройки</span>
        </Link>
      </nav>
    </aside>
  );
}

