import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { isValidEmail } from "@/lib/validators";
import {
  isRateLimited,
  recordAttempt,
  getRemainingAttempts
} from "@/lib/rate-limit";
import { createApiHandler, getClientIdentifier, parseJson } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const POST = createApiHandler(async (req) => {
  const { email: rawEmail, password } = await parseJson(req, loginSchema);

  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Некорректный email" },
      { status: 400 }
    );
  }

  const rateKey = `login:${getClientIdentifier(req)}:${email}`;
  if (isRateLimited(rateKey)) {
    return NextResponse.json(
      {
        error: "Слишком много попыток входа. Попробуйте через 15 минут.",
        remainingAttempts: 0
      },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.password) {
    recordAttempt(rateKey);
    return NextResponse.json(
      {
        error: "Неверный email или пароль",
        remainingAttempts: getRemainingAttempts(rateKey)
      },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    recordAttempt(rateKey);
    return NextResponse.json(
      {
        error: "Неверный email или пароль",
        remainingAttempts: getRemainingAttempts(rateKey)
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Успешный вход. Используйте signIn('credentials', { email, password }) для сессии."
  });
});
