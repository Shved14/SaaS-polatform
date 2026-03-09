import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validators";
import { assertRateLimit, createApiHandler, parseJson } from "@/lib/api";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/)
});

export const POST = createApiHandler(async (req) => {
  // защита от брутфорса кода
  assertRateLimit(req, "verify_code");

  const { email: rawEmail, code: rawCode } = await parseJson(
    req,
    verifySchema
  );

  const email = rawEmail.trim().toLowerCase();
  const code = rawCode.trim();

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Некорректный email" },
      { status: 400 }
    );
  }

  const record = await prisma.verificationCode.findUnique({
    where: { email_code: { email, code } }
  });

  if (!record) {
    return NextResponse.json(
      { error: "Неверный или истёкший код" },
      { status: 400 }
    );
  }
  if (new Date() > record.expiresAt) {
    await prisma.verificationCode.delete({ where: { id: record.id } });
    return NextResponse.json(
      { error: "Код истёк. Запросите новый." },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (!existingUser) {
    if (!record.hashedPassword) {
      return NextResponse.json(
        { error: "Сессия регистрации истекла. Зарегистрируйтесь заново." },
        { status: 400 }
      );
    }
    await prisma.user.create({
      data: {
        email,
        password: record.hashedPassword,
        name: record.name ?? null,
        emailVerified: new Date(),
        plan: "FREE"
      }
    });
  } else if (!existingUser.emailVerified) {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() }
    });
  }

  await prisma.verificationCode.delete({ where: { id: record.id } });

  return NextResponse.json({
    ok: true,
    message: "Email подтверждён. Теперь можно войти."
  });
});
