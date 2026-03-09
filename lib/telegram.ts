import { createHmac, createHash } from "crypto";

/** Данные от Telegram Login Widget (поля приходят в camelCase или snake_case) */
export interface TelegramAuthPayload {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const AUTH_DATE_MAX_AGE_SEC = 5 * 60; // 5 минут

/**
 * Проверяет подпись и давность auth_date.
 * См. https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(
  payload: TelegramAuthPayload,
  botToken: string
): boolean {
  const { hash, auth_date, ...rest } = payload as TelegramAuthPayload & Record<string, unknown>;
  if (!hash || !auth_date || !botToken) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - auth_date) > AUTH_DATE_MAX_AGE_SEC) return false;

  const dataCheckString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return computedHash === hash;
}
