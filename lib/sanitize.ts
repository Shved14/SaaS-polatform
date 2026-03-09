export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim();
  const withoutControlChars = trimmed.replace(/[\u0000-\u001F\u007F]/g, "");
  return withoutControlChars.slice(0, maxLength);
}

export function sanitizeNullableString(
  input: unknown,
  maxLength = 500
): string | null {
  const value = sanitizeString(input, maxLength);
  return value === "" ? null : value;
}

