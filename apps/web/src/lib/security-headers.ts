// Headers applied to every response. CSP is set separately via Astro's
// security.csp config (a <meta> tag with hashes for inline scripts/styles).
// frame-ancestors can't be expressed in meta-CSP, so X-Frame-Options: DENY
// is the canonical clickjacking guard here.
export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

export const applySecurityHeaders = (response: Response): void => {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
};
