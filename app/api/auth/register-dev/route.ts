import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { isValidEmail, validatePassword } from "@/lib/validators";

const registerDevSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  name: z.string().max(100).optional()
});

export const POST = async (req: Request) => {
  // Только для разработки!
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Этот endpoint доступен только в режиме разработки" },
      { status: 403 }
    );
  }

  try {
    const { email: rawEmail, password, name } = await req.json();
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

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        emailVerified: new Date(),
        plan: "FREE"
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Регистрация успешна. Теперь можно войти.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error("Dev registration error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
};
