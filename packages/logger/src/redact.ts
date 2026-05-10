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

// Keys that, if assigned via bracket notation on a plain object, can mutate
// the prototype chain ("__proto__") or shadow real properties on consumers.
// We never want them in serialized log output.
const PROTOTYPE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const normalizeKey = (key: string): string =>
  key.toLowerCase().replaceAll("_", "");

const isSensitiveKey = (key: string): boolean => {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEY_SUBSTRINGS.some((needle) =>
    normalized.includes(needle.replaceAll("_", ""))
  );
};

// Built-ins like Date, URL, Error, Map have meaningful JSON.stringify
// behavior (Date.toJSON returns an ISO string, etc.). Rebuilding them as
// plain objects via Object.entries silently strips that. Recurse only into
// "plain" objects whose prototype is Object.prototype or null.
const isPlainObject = (value: object): boolean => {
  const proto: object | null = Object.getPrototypeOf(value) as object | null;
  return proto === Object.prototype || proto === null;
};

export const redact = (value: unknown, depth = 0): unknown => {
  if (depth > MAX_DEPTH) {
    return REDACTED;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1));
  }
  if (value !== null && typeof value === "object") {
    if (!isPlainObject(value)) {
      return value;
    }
    const out: Record<string, unknown> = Object.create(null) as Record<
      string,
      unknown
    >;
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>
    )) {
      if (PROTOTYPE_KEYS.has(key)) {
        continue;
      }
      out[key] = isSensitiveKey(key) ? REDACTED : redact(child, depth + 1);
    }
    return out;
  }
  return value;
};
