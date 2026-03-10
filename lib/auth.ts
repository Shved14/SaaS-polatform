import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { isValidEmail } from "@/lib/validators";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";
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
      name: "next-auth.session-token",
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
        password: { label: "Пароль", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) return null;

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
    }),
    GitHub({
      clientId: env.AUTH_GITHUB_ID ?? "",
      clientSecret: env.AUTH_GITHUB_SECRET ?? ""
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

