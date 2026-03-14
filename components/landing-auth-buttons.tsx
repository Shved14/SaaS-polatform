"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function LandingAuthButtons() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button size="lg" className="w-full sm:w-auto" asChild>
        <Link href="/auth/signin?method=email">
          Регистрация через email
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => signIn("google", { callbackUrl: "/app/dashboard" })}
      >
        Регистрация через Google
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => signIn("github", { callbackUrl: "/app/dashboard" })}
      >
        Регистрация через GitHub
      </Button>
    </div>
  );
}
