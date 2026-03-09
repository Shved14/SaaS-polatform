"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck } from "lucide-react";
import Link from "next/link";

const verifySchema = z.object({
  email: z.string().email("Укажите корректный email"),
  code: z.string().regex(/^\d{6}$/, "Код должен содержать 6 цифр")
});

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get("email");
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    } else if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("taskflow_signup_email");
      if (storedEmail) setEmail(storedEmail);
    }
  }, [searchParams]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parse = verifySchema.safeParse({ email, code });
    if (!parse.success) {
      const firstError =
        parse.error.flatten().fieldErrors.email?.[0] ??
        parse.error.flatten().fieldErrors.code?.[0] ??
        "Проверьте корректность данных";
      setError(firstError);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parse.data)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Код неверный или истёк.");
        return;
      }

      // после успешной верификации пробуем автоматически залогинить пользователя
      let password: string | null = null;
      if (typeof window !== "undefined") {
        password = sessionStorage.getItem("taskflow_signup_password");
      }

      if (password) {
        const result = await signIn("credentials", {
          email: parse.data.email.trim().toLowerCase(),
          password,
          callbackUrl: "/app/dashboard",
          redirect: false
        });
        if (result?.error) {
          setError("Вход не удался. Войдите вручную на странице входа.");
          return;
        }
        router.replace("/app/dashboard");
      } else {
        router.replace("/auth/signin");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("taskflow_signup_email");
        sessionStorage.removeItem("taskflow_signup_password");
      }
      setIsSubmitting(false);
    }
  }

  return (
    <Container className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-secondary-foreground">
            <Sparkles className="h-3 w-3" />
            Подтвердите свой email
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Введите 6‑значный код
          </h1>
          <p className="text-xs text-muted-foreground">
            Мы отправили код подтверждения на{" "}
            <span className="font-medium text-foreground">
              {email || "ваш email"}
            </span>
            . Введите его ниже, чтобы завершить регистрацию.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Код подтверждения
            </label>
            <div className="flex items-center gap-2 rounded-md border bg-background px-2">
              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/[^0-9]/g, ""))
                }
                className="h-9 w-full bg-transparent text-center text-lg tracking-[0.4em] focus-visible:outline-none"
                required
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button
            type="submit"
            size="sm"
            className="mt-1 w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Проверяем..." : "Подтвердить email"}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground">
          Не получили письмо? Проверьте папку «Спам» или{" "}
          <span className="font-medium">запросите новый код позже.</span>
        </p>

        <p className="text-center text-[11px] text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href="/auth/signin" className="underline underline-offset-2">
            Войти
          </Link>
        </p>
      </div>
    </Container>
  );
}

