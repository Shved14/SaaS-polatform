"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { KanbanSquare, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface InvitePageProps {
  params: { workspaceId: string; token: string };
}

type InviteState = "loading" | "ready" | "accepting" | "accepted" | "error";

interface InviteInfo {
  workspaceName: string;
  inviterName: string;
  email: string;
  expiresAt: string;
}

export default function InvitePage({ params }: InvitePageProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [state, setState] = useState<InviteState>("loading");
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [acceptedWorkspaceId, setAcceptedWorkspaceId] = useState("");

  // Загружаем информацию о приглашении
  useEffect(() => {
    async function loadInvite() {
      try {
        const res = await fetch(`/api/invitations/info?token=${params.token}&workspaceId=${params.workspaceId}`);
        if (!res.ok) {
          const data = await res.json();
          setErrorMsg(data.error || "Приглашение не найдено");
          setState("error");
          return;
        }
        const data = await res.json();
        setInvite(data);
        setState("ready");
      } catch {
        setErrorMsg("Не удалось загрузить приглашение");
        setState("error");
      }
    }
    void loadInvite();
  }, [params.token, params.workspaceId]);

  async function handleAccept() {
    if (sessionStatus !== "authenticated") {
      // Redirect to sign in, then back here
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/invite/${params.workspaceId}/${params.token}`)}`);
      return;
    }

    setState("accepting");
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Ошибка при принятии приглашения");
        setState("error");
        return;
      }

      setAcceptedWorkspaceId(data.workspaceId);
      setState("accepted");
    } catch {
      setErrorMsg("Ошибка сети");
      setState("error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
            <KanbanSquare className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold">TaskFlow</span>
        </div>

        {/* Loading */}
        {state === "loading" && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Загрузка приглашения...</p>
            </CardContent>
          </Card>
        )}

        {/* Ready - show invite info */}
        {state === "ready" && invite && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Приглашение в workspace</CardTitle>
              <CardDescription>
                Вас пригласили присоединиться к рабочему пространству
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Workspace</span>
                  <span className="font-semibold">{invite.workspaceName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Пригласил</span>
                  <span>{invite.inviterName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Для</span>
                  <span>{invite.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Действует до</span>
                  <span>{new Date(invite.expiresAt).toLocaleDateString("ru-RU")}</span>
                </div>
              </div>

              {sessionStatus === "authenticated" ? (
                <Button className="w-full" size="lg" onClick={handleAccept}>
                  Принять приглашение
                </Button>
              ) : (
                <div className="space-y-3">
                  <Button className="w-full" size="lg" onClick={handleAccept}>
                    Войти и принять приглашение
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Вам нужно войти или зарегистрироваться, чтобы принять приглашение
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Accepting */}
        {state === "accepting" && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Принимаем приглашение...</p>
            </CardContent>
          </Card>
        )}

        {/* Accepted */}
        {state === "accepted" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Приглашение принято!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Вы успешно присоединились к workspace
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link href={`/app/workspace/${acceptedWorkspaceId}`}>
                  Перейти в workspace
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {state === "error" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <XCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">Ошибка</h3>
                <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
              </div>
              <div className="flex gap-3 justify-center mt-4">
                <Button variant="outline" asChild>
                  <Link href="/">На главную</Link>
                </Button>
                {sessionStatus === "authenticated" && (
                  <Button asChild>
                    <Link href="/app/dashboard">Панель управления</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
