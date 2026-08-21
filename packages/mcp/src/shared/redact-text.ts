// marzban-sdk redacts secret-bearing fields inside `SdkError.details` at
// construction time, but that only covers structured `details`. Error text
// rendered here goes straight into a model's context — a far more sensitive
// sink than a log line — so this applies a narrow, string-level scrub as
// defense in depth. This is deliberately not a full port of the SDK's
// object-level `redactSecrets` (tracked as marzban-sdk P1, not yet exported):
// it only catches the handful of patterns that can plausibly end up in
// already-flattened error text (bearer headers, raw JWTs, stringified
// JSON secrets), not arbitrary nested objects.
const TEXT_PATTERNS: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  { pattern: /Bearer\s+[A-Za-z0-9\-_.]+/gi, replacement: 'Bearer [REDACTED]' },
  { pattern: /eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/g, replacement: '[REDACTED_JWT]' },
  {
    pattern: /("(?:password|token|access_token|secret)"\s*:\s*)"[^"]*"/gi,
    replacement: '$1"[REDACTED]"',
  },
]

export function redactText(text: string): string {
  return TEXT_PATTERNS.reduce((acc, { pattern, replacement }) => acc.replace(pattern, replacement), text)
}
