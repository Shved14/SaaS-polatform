"use client";

import { useState, FormEvent, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles, Users } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invitationToken = searchParams.get("invitation_token");
  const invitationEmail = searchParams.get("email");
  const workspaceName = searchParams.get("workspace_name");

  useEffect(() => {
    if (invitationEmail) {
      setEmail(invitationEmail);
    }
  }, [invitationEmail]);

  const errorParam = searchParams.get("error");
  const errorMessage =
    errorParam === "CredentialsSignin"
      ? "Неверный email или пароль."
      : errorParam === "invalid_token"
        ? "Недействительная ссылка приглашения."
        : errorParam === "invitation_not_found"
          ? "Приглашение не найдено или истекло."
          : errorParam === "server_error"
            ? "Ошибка сервера. Попробуйте ещё раз."
            : errorParam
              ? "Не удалось войти. Попробуйте ещё раз."
              : null;

  async function handleEmailSignIn(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      const callbackUrl = invitationToken ? "/app/dashboard" : "/app/dashboard";
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false
      });

      if (result?.error) {
        return;
      }

      if (invitationToken) {
        // Handle invitation after successful login
        console.log('Processing invitation after login:', {
          invitationToken,
          userEmail: email
        });

        try {
          const response = await fetch("/api/invitations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invitationToken })
          });

          console.log('Invitation API response:', {
            status: response.status,
            ok: response.ok
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Invitation accepted:', data);
            router.push(`/app/workspace/${data.workspaceId}`);
          } else {
            const errorData = await response.json();
            console.error('Invitation error:', errorData);
            router.push("/app/dashboard");
          }
        } catch (error) {
          console.error("Error accepting invitation:", error);
          router.push("/app/dashboard");
        }
      } else {
        router.push("/app/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-secondary-foreground">
            <Sparkles className="h-3 w-3" />
            Добро пожаловать в TaskFlow
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Вход в аккаунт
          </h1>
          <p className="text-xs text-muted-foreground">
            {workspaceName ? (
              <>
                Вас пригласили в рабочее пространство <strong>"{workspaceName}"</strong>.
                Войдите, чтобы присоединиться.
              </>
            ) : (
              <>
                Войдите с помощью email и пароля или через Google. Если у вас ещё
                нет аккаунта, сначала{" "}
                <Link href="/auth/signup" className="underline underline-offset-2">
                  зарегистрируйтесь
                </Link>
                .
              </>
            )}
          </p>
          {workspaceName && (
            <div className="flex items-center justify-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <Users className="h-3 w-3" />
              Приглашение в "{workspaceName}"
            </div>
          )}
        </div>

        <div className="space-y-3">
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Пароль
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="w-full"
              disabled={isSubmitting}
            >
              <Mail className="mr-2 h-3.5 w-3.5" />
              {isSubmitting ? "Входим..." : "Войти через email"}
            </Button>
          </form>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            или
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              signIn("google", {
                callbackUrl: "/app/dashboard"
              })
            }
          >
            <svg
              className="mr-2 h-3.5 w-3.5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M21.6 12.2273C21.6 11.5182 21.5364 10.8364 21.4182 10.1818H12V13.85H17.3818C17.15 15.1 16.4636 16.1636 15.4 16.8727V19.2273H18.3818C20.2 17.5545 21.6 15.1364 21.6 12.2273Z"
                fill="#4285F4"
              />
              <path
                d="M12 21.5C14.7 21.5 16.9636 20.6091 18.3818 19.2273L15.4 16.8727C14.6364 17.3818 13.6091 17.7 12 17.7C9.38182 17.7 7.16364 16.0182 6.37273 13.6545H3.3V16.0909C4.70909 19.1364 8.09091 21.5 12 21.5Z"
                fill="#34A853"
              />
              <path
                d="M6.37273 13.6545C6.16364 13.1455 6.04545 12.5909 6.04545 12C6.04545 11.4091 6.16364 10.8545 6.37273 10.3455V7.90909H3.3C2.69091 9.11818 2.34091 10.5182 2.34091 12C2.34091 13.4818 2.69091 14.8818 3.3 16.0909L6.37273 13.6545Z"
                fill="#FBBC05"
              />
              <path
                d="M12 6.3C13.7545 6.3 15.2727 6.90909 16.4818 8.06364L18.4636 6.08182C16.9636 4.61818 14.7 3.7 12 3.7C8.09091 3.7 4.70909 6.06364 3.3 9.10909L6.37273 11.5455C7.16364 9.18182 9.38182 7.5 12 7.5V6.3Z"
                fill="#EA4335"
              />
            </svg>
            Войти через Google
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              signIn("github", {
                callbackUrl: "/app/dashboard"
              })
            }
          >
            <svg
              className="mr-2 h-3.5 w-3.5"
              viewBox="0 0 16 16"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
                 -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
                 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2
                 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65
                 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
              />
            </svg>
            Войти через GitHub
          </Button>

          {errorMessage && (
            <p className="mt-2 text-xs text-red-500">{errorMessage}</p>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Нажимая кнопку входа, вы соглашаетесь с{" "}
          <Link href="/terms" className="underline underline-offset-2">
            условиями сервиса
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}

