import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, plan: true, createdAt: true, proUntil: true }
  });

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="p-4 md:p-6">
      <Container className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Профиль</h1>
            <p className="text-sm text-muted-foreground">
              Данные вашего аккаунта
            </p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Имя</span>
            <span>{user.name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user.email ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Тариф</span>
            <span>
              {user.plan === "PRO"
                ? "Pro"
                : "Бесплатный"}
              {user.plan === "PRO" && user.proUntil && (
                <>
                  {" "}
                  (до{" "}
                  {user.proUntil.toLocaleDateString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                  })}
                  )
                </>
              )}
            </span>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/app/dashboard">К доскам</Link>
        </Button>
      </Container>
    </div>
  );
}
