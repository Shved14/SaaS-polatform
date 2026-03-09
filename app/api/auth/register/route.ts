import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import {
  isValidEmail,
  validatePassword,
  generateVerificationCode
} from "@/lib/validators";
import { sendVerificationEmail } from "@/lib/email";
import { sanitizeNullableString } from "@/lib/sanitize";
import { assertRateLimit, createApiHandler, parseJson } from "@/lib/api";

const CODE_EXPIRES_MINUTES = 10;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  name: z.string().max(100).optional()
});

export const POST = createApiHandler(async (req) => {
  // rate limit по IP для регистрации
  assertRateLimit(req, "register");

  const { email: rawEmail, password, name } = await parseJson(
    req,
    registerSchema
  );

  const email = rawEmail.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Некорректный формат email" },
      { status: 400 }
    );
  }

  const pwdCheck = validatePassword(password ?? "");
  if (!pwdCheck.valid) {
    return NextResponse.json(
      { error: pwdCheck.error ?? "Некорректный пароль" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже зарегистрирован" },
      { status: 409 }
    );
  }

  const hashedPassword = await hashPassword(password);
  const code = generateVerificationCode();
  const expiresAt = new Date(
    Date.now() + CODE_EXPIRES_MINUTES * 60 * 1000
  );

  const existingCode = await prisma.verificationCode.findFirst({
    where: {
      email,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (existingCode) {
    return NextResponse.json(
      {
        error:
          "Код уже отправлен. Проверьте почту или попробуйте позже."
      },
      { status: 429 }
    );
  }

  await prisma.verificationCode.deleteMany({ where: { email } });
  await prisma.verificationCode.create({
    data: {
      email,
      code,
      expiresAt,
      hashedPassword,
      name: sanitizeNullableString(name, 100)
    }
  });

  const sendResult = await sendVerificationEmail(email, code);
  if (!sendResult.ok) {
    return NextResponse.json(
      {
        error: "Не удалось отправить письмо. Попробуйте позже.",
        details: sendResult.error
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Регистрация успешна. Проверьте email и введите код подтверждения."
  });
});
