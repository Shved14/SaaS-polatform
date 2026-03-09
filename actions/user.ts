"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;
  return userId;
}

export async function updateThemeAction(formData: FormData) {
  const userId = await requireUserId();
  if (!userId) return { error: "Не авторизован" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, proUntil: true }
  });
  const now = new Date();
  const isProActive =
    user && user.plan === "PRO" && (user.proUntil == null || user.proUntil > now);

  if (!user || !isProActive) {
    return { error: "Кастомизация темы доступна только на тарифе Pro" };
  }

  const primary = (formData.get("primary") as string)?.trim();
  const background = (formData.get("background") as string)?.trim();
  const accentTodo = (formData.get("accentTodo") as string)?.trim();
  const accentInProgress = (formData.get("accentInProgress") as string)?.trim();
  const accentReview = (formData.get("accentReview") as string)?.trim();
  const accentDone = (formData.get("accentDone") as string)?.trim();

  const theme: Record<string, string> = {};
  if (primary && /^#[0-9A-Fa-f]{6}$/.test(primary)) theme.primary = primary;
  if (background && /^#[0-9A-Fa-f]{6}$/.test(background)) theme.background = background;
  if (accentTodo && /^#[0-9A-Fa-f]{6}$/.test(accentTodo)) {
    theme.accentTodo = accentTodo;
  }
  if (accentInProgress && /^#[0-9A-Fa-f]{6}$/.test(accentInProgress)) {
    theme.accentInProgress = accentInProgress;
  }
  if (accentReview && /^#[0-9A-Fa-f]{6}$/.test(accentReview)) {
    theme.accentReview = accentReview;
  }
  if (accentDone && /^#[0-9A-Fa-f]{6}$/.test(accentDone)) {
    theme.accentDone = accentDone;
  }

  const themeStr = Object.keys(theme).length ? JSON.stringify(theme) : null;

  await prisma.user.update({
    where: { id: userId },
    data: { theme: themeStr }
  });

  revalidatePath("/app/settings");
  revalidatePath("/app/dashboard");
  revalidatePath("/app/board");
  return {};
}

export async function setPlanAction(plan: "FREE" | "PRO") {
  const userId = await requireUserId();
  if (!userId) return { error: "Не авторизован" };
  const now = new Date();
  const data =
    plan === "PRO"
      ? {
          plan: "PRO",
          proUntil: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        }
      : {
          plan: "FREE",
          proUntil: null
        };

  await prisma.user.update({
    where: { id: userId },
    data
  });
  revalidatePath("/app/account");
  revalidatePath("/app/settings");
  revalidatePath("/app/dashboard");
  return {};
}
