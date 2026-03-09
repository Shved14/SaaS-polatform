import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { isValidEmail } from "@/lib/validators";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";
import { verifyTelegramAuth, type TelegramAuthPayload } from "@/lib/telegram";
import { env } from "@/lib/env";

const getRateLimitKey = (identifier: string) => `nextauth:${identifier}`;

export const authOptions: NextAuthOptions = {
  secret: env.AUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
    updateAge: 24 * 60 * 60 // обновлять сессию раз в сутки
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60
      }
    }
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Email и пароль",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
        telegramAuth: { label: "Telegram", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const telegramJson = credentials.telegramAuth as string | undefined;
        if (telegramJson) {
          const botToken = process.env.TELEGRAM_BOT_TOKEN;
          if (!botToken) return null;
          try {
            const payload = JSON.parse(telegramJson) as TelegramAuthPayload;
            if (!verifyTelegramAuth(payload, botToken)) return null;
            let user = await prisma.user.findUnique({
              where: { telegramId: String(payload.id) }
            });
            if (!user) {
              const photo = payload.photo_url ?? null;
              user = await prisma.user.create({
                data: {
                  telegramId: String(payload.id),
                  name: [payload.first_name, payload.last_name].filter(Boolean).join(" ") || null,
                  avatar: photo,
                  image: photo,
                  plan: "FREE"
                }
              });
            }
            return {
              id: user.id,
              email: user.email ?? undefined,
              name: user.name ?? undefined,
              image: user.avatar ?? undefined
            };
          } catch {
            return null;
          }
        }

        const email = (credentials.email as string)?.trim()?.toLowerCase();
        const password = credentials.password as string;
        if (!email || !isValidEmail(email) || !password) return null;

        const rateKey = getRateLimitKey(email);
        if (isRateLimited(rateKey)) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) {
          recordAttempt(rateKey);
          return null;
        }
        const valid = await verifyPassword(password, user.password);
        if (!valid) {
          recordAttempt(rateKey);
          return null;
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
          image: user.avatar ?? undefined
        };
      }
    }),
    Google({
      clientId: env.AUTH_GOOGLE_ID ?? "",
      clientSecret: env.AUTH_GOOGLE_SECRET ?? ""
    })
  ],
  pages: {
    signIn: "/auth/signin"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email ?? null;
      }
      return session;
    }
  },
};

