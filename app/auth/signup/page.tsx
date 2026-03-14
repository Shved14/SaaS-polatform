"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Mail, User, Sparkles } from "lucide-react";
import Link from "next/link";

const signupSchema = z
  .object({
    name: z.string().min(1, "Введите имя").max(100),
    email: z.string().email("Укажите корректный email"),
    password: z
      .string()
      .min(8, "Пароль должен быть не менее 8 символов"),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли должны совпадать",
    path: ["confirmPassword"]
  });

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parse = signupSchema.safeParse({
      name,
      email,
      password,
      confirmPassword
    });

    if (!parse.success) {
      const firstError =
        parse.error.flatten().fieldErrors.name?.[0] ??
        parse.error.flatten().fieldErrors.email?.[0] ??
        parse.error.flatten().fieldErrors.password?.[0] ??
        parse.error.flatten().fieldErrors.confirmPassword?.[0] ??
        "Проверьте корректность данных";
      setError(firstError);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parse.data.name,
          email: parse.data.email,
          password: parse.data.password
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Не удалось отправить код. Попробуйте позже.");
        return;
      }

      // сохраняем данные для автологина после верификации
      if (typeof window !== "undefined") {
        sessionStorage.setItem("taskflow_signup_email", parse.data.email);
        sessionStorage.setItem("taskflow_signup_password", parse.data.password);
      }

      router.push(`/auth/verify?email=${encodeURIComponent(parse.data.email)}`);
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
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
            Создайте аккаунт TaskFlow
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Регистрация
          </h1>
          <p className="text-xs text-muted-foreground">
            Заполните данные, мы отправим 6‑значный код подтверждения на ваш
            email.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Имя
            </label>
            <div className="flex items-center gap-2 rounded-md border bg-background px-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 w-full bg-transparent text-sm focus-visible:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Email
            </label>
            <div className="flex items-center gap-2 rounded-md border bg-background px-2">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 w-full bg-transparent text-sm focus-visible:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Пароль
            </label>
            <div className="flex items-center gap-2 rounded-md border bg-background px-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 w-full bg-transparent text-sm focus-visible:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Повторите пароль
            </label>
            <div className="flex items-center gap-2 rounded-md border bg-background px-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-9 w-full bg-transparent text-sm focus-visible:outline-none"
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
            {isSubmitting ? "Отправляем код..." : "Продолжить"}
            {!isSubmitting && <ArrowRight className="ml-2 h-3.5 w-3.5" />}
          </Button>
        </form>

        <p className="text-center text-[11px] text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href="/auth/signin" className="underline underline-offset-2">
            Войти
          </Link>
        </p>

        <p className="text-center text-[11px] text-muted-foreground">
          Регистрируясь, вы соглашаетесь с{" "}
          <Link href="/terms" className="underline underline-offset-2">
            условиями сервиса
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}

