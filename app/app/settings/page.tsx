import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Settings } from "lucide-react";
import { ThemeSettings } from "./theme-settings";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, theme: true, proUntil: true }
  });

  const now = new Date();
  const plan = user?.plan ?? "FREE";
  const isProActive =
    plan === "PRO" &&
    user?.proUntil &&
    user.proUntil.getTime() > now.getTime();

  return (
    <div className="p-4 md:p-6">
      <Container className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Настройки</h1>
            <p className="text-sm text-muted-foreground">
              Внешний вид и параметры приложения
            </p>
            {isProActive && user?.proUntil && (
              <p className="text-xs text-muted-foreground">
                Pro активно до{" "}
                {user.proUntil.toLocaleDateString("ru-RU", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric"
                })}
              </p>
            )}
          </div>
        </div>
        <ThemeSettings plan={isProActive ? "PRO" : "FREE"} themeJson={user?.theme ?? null} />
      </Container>
    </div>
  );
}
