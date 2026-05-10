// Substring match against the lowercased, underscore-stripped key name.
// Substring matching catches camelCase / prefixed variants without listing
// every spelling: "Authorization", "accessToken", "apiKey", "x-api-key",
// "set-cookie", "AWS_SECRET_KEY" all match.
const SENSITIVE_KEY_SUBSTRINGS = [
  "authoriz",
  "cookie",
  "token",
  "secret",
  "password",
  "apikey",
  "api-key",
  "bearer",
  "credential",
  "privatekey",
  "private-key",
] as const;

export const REDACTED = "[REDACTED]";

const MAX_DEPTH = 8;

const normalizeKey = (key: string): string =>
  key.toLowerCase().replaceAll("_", "");

const isSensitiveKey = (key: string): boolean => {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEY_SUBSTRINGS.some((needle) =>
    normalized.includes(needle.replaceAll("_", ""))
  );
};

export const redact = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) {
    return REDACTED;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>
    )) {
      out[key] = isSensitiveKey(key) ? REDACTED : redact(child, depth + 1);
    }
    return out;
  }
  return value;
};
