/**
 * Валидация email (RFC-подобный формат).
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  if (!value || value.length > 255) return false;
  return EMAIL_REGEX.test(value.trim());
}

/** Минимум 8 символов, буквы и цифры, опционально спецсимволы */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const HAS_LETTER = /[a-zA-Z]/;
const HAS_NUMBER = /\d/;

export interface PasswordValidation {
  valid: boolean;
  error?: string;
}

export function validatePassword(password: string): PasswordValidation {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: "Пароль не менее 8 символов" };
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return { valid: false, error: "Пароль не более 128 символов" };
  }
  if (!HAS_LETTER.test(password)) {
    return { valid: false, error: "Пароль должен содержать буквы" };
  }
  if (!HAS_NUMBER.test(password)) {
    return { valid: false, error: "Пароль должен содержать цифры" };
  }
  return { valid: true };
}

export function generateVerificationCode(): string {
  return Math.floor(100_000 + Math.random() * 900_000).toString();
}
