import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    console.log('🔍 Debug login attempt:', { email, password });

    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    console.log('👤 User found:', !!user);
    if (user) {
      console.log('📧 User email:', user.email);
      console.log('🔐 Has password:', !!user.password);
      console.log('✅ Email verified:', !!user.emailVerified);
    }

    if (!user?.password) {
      return NextResponse.json({
        error: "User not found or no password",
        user: !!user,
        hasPassword: !!user?.password
      });
    }

    // Проверяем пароль
    const valid = await verifyPassword(password, user.password);
    console.log('🔓 Password valid:', valid);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      },
      passwordValid: valid
    });

  } catch (error) {
    console.error('❌ Debug login error:', error);

return NextResponse.json({
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined
}, { status: 500 });
  }
}
