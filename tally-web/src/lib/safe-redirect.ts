/**
 * Return `value` only when it is a same-origin relative path, otherwise
 * `fallback`. Rejects absolute URLs and protocol-relative forms such as
 * `//host` and `/\host`, which browsers treat as another origin.
 */
export function safeRedirectPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith("/") || value[1] === "/" || value[1] === "\\") return fallback;
  // Browsers strip tabs and newlines from URLs, so "/\t/host" would become "//host".
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code < 0x20 || code === 0x7f) return fallback;
  }
  return value;
}
