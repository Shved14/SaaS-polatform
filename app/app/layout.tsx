import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReactNode } from "react";

type Theme = {
  primary?: string;
  background?: string;
  accentTodo?: string;
  accentInProgress?: string;
  accentReview?: string;
  accentDone?: string;
};

function parseTheme(json: string | null): Theme | null {
  if (!json) return null;
  try {
    const o = JSON.parse(json) as Record<string, string>;
    const out: Record<string, string> = {};
    if (o.primary && /^#[0-9A-Fa-f]{6}$/.test(o.primary)) out.primary = o.primary;
    if (o.background && /^#[0-9A-Fa-f]{6}$/.test(o.background)) out.background = o.background;
    if (o.accentTodo && /^#[0-9A-Fa-f]{6}$/.test(o.accentTodo)) {
      out.accentTodo = o.accentTodo;
    }
    if (o.accentInProgress && /^#[0-9A-Fa-f]{6}$/.test(o.accentInProgress)) {
      out.accentInProgress = o.accentInProgress;
    }
    if (o.accentReview && /^#[0-9A-Fa-f]{6}$/.test(o.accentReview)) {
      out.accentReview = o.accentReview;
    }
    if (o.accentDone && /^#[0-9A-Fa-f]{6}$/.test(o.accentDone)) {
      out.accentDone = o.accentDone;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  let theme: Theme | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, theme: true, proUntil: true }
    });
    const now = new Date();
    const isProActive =
      user &&
      user.plan === "PRO" &&
      (user.proUntil == null || user.proUntil > now);

    if (isProActive && user.theme) {
      theme = parseTheme(user.theme);
    }
  }

  if (!theme) {
    return <>{children}</>;
  }

  const style = {
    ...(theme.background && { ["--theme-background" as string]: theme.background }),
    ...(theme.primary && { ["--theme-primary" as string]: theme.primary }),
    ...(theme.accentTodo && { ["--column-todo-bg" as string]: theme.accentTodo }),
    ...(theme.accentInProgress && {
      ["--column-inprogress-bg" as string]: theme.accentInProgress
    }),
    ...(theme.accentReview && { ["--column-review-bg" as string]: theme.accentReview }),
    ...(theme.accentDone && { ["--column-done-bg" as string]: theme.accentDone })
  };

  return (
    <div data-theme="pro" className="min-h-full" style={style}>
      {children}
    </div>
  );
}
