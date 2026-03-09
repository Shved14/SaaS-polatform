/**
 * In-memory rate limit для логина (по ключу, например email или IP).
 * В продакшене лучше использовать Redis.
 */
const store = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 минут
const MAX_ATTEMPTS = 5;

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) return false;
  if (now >= entry.resetAt) {
    store.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordAttempt(key: string): void {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function getRemainingAttempts(key: string): number {
  const entry = store.get(key);
  if (!entry) return MAX_ATTEMPTS;
  if (Date.now() >= entry.resetAt) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - entry.count);
}
