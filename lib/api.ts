import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isRateLimited, recordAttempt } from "@/lib/rate-limit";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireAuth(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    throw new ApiError(401, "Необходима аутентификация");
  }
  return userId;
}

export function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function assertRateLimit(req: Request, scope: string): void {
  const key = `${scope}:${getClientIdentifier(req)}`;
  if (isRateLimited(key)) {
    throw new ApiError(
      429,
      "Слишком много запросов. Попробуйте позже."
    );
  }
  recordAttempt(key);
}

export async function parseJson<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<T> {
  const json = await req.json();
  return schema.parse(json);
}

export function createApiHandler<
  Params extends Record<string, string> = Record<string, string>
>(
  handler: (
    req: Request,
    context: { params: Params }
  ) => Promise<NextResponse>
) {
  return async (req: Request, context: { params: Params }) => {
    try {
      // Базовая CSRF защита: блокируем кросс-доменные небезопасные запросы
      const method = req.method.toUpperCase();
      if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
        const origin = req.headers.get("origin");
        const host = req.headers.get("host");
        if (origin && host && !origin.includes(host)) {
          throw new ApiError(403, "Cross-site запросы запрещены");
        }
      }

      return await handler(req, context);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message },
          { status: err.status }
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Некорректные данные", details: err.flatten() },
          { status: 400 }
        );
      }
      console.error("Unhandled API error:", err);
      return NextResponse.json(
        { error: "Внутренняя ошибка сервера" },
        { status: 500 }
      );
    }
  };
}

