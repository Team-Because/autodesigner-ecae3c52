/**
 * Server-Side Request Forgery guard. Only allow HTTPS URLs targeting public
 * hosts — refuse localhost, RFC1918 private ranges, link-local, and known
 * cloud metadata endpoints. Every fetch of a user-supplied URL MUST pass
 * through this before hitting the wire.
 */
export function isSafePublicHttpsUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    const h = u.hostname.toLowerCase();
    if (
      h === "localhost" ||
      h.endsWith(".localhost") ||
      h === "0.0.0.0" ||
      /^127\./.test(h) ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^169\.254\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(h) ||
      h === "metadata.google.internal"
    ) return false;
    return true;
  } catch {
    return false;
  }
}
