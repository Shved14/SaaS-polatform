"use client";

import { useTransition } from "react";
import { setPlanAction } from "@/actions/user";
import { Button } from "@/components/ui/button";

export function PricingProButton({
  isActive,
  activeUntil
}: {
  isActive: boolean;
  activeUntil: Date | null;
}) {
  const [isPending, startTransition] = useTransition();

  if (isActive && activeUntil) {
    return (
      <Button className="mt-6 w-full" disabled>
        Pro активно до{" "}
        {activeUntil.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        })}
      </Button>
    );
  }

  return (
    <Button
      className="mt-6 w-full"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await setPlanAction("PRO");
          window.location.reload();
        });
      }}
    >
      {isPending ? "Включение…" : "Включить Pro (3 дня демо)"}
    </Button>
  );
}
