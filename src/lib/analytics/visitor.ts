/**
 * Turning a request into a countable visitor, without retaining anything that
 * identifies them.
 *
 * The IP and user agent are read, hashed together with a secret and the current
 * UTC date, and then discarded. Only the digest is ever passed to the store, and
 * the store folds it into a HyperLogLog sketch that cannot be reversed.
 *
 * The date is inside the hash on purpose. It means the same person produces a
 * different id tomorrow, so there is no key that follows anyone across days,
 * which is what makes this a counter rather than surveillance. It also means
 * "uniques" is strictly a per-day figure and cannot be summed across the month.
 */

/** Coarse but effective. Anything self-identifying as automation is skipped. */
const BOT_PATTERN =
  /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|discord|slack|preview|monitor|uptime|curl|wget|python-requests|axios|headless|lighthouse|pagespeed|gtmetrix|semrush|ahrefs|dataprovider|scrapy|phantomjs|puppeteer|playwright/i;

export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return true; // no UA at all is almost never a real browser
  return BOT_PATTERN.test(userAgent);
}

/**
 * Only the first entry of x-forwarded-for is the client; the rest are proxies.
 * Never stored, only hashed.
 */
function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

export async function visitorId(
  headers: Headers,
  date: string,
): Promise<string> {
  const ip = clientIp(headers);
  const ua = headers.get("user-agent") ?? "";
  // Falls back to a constant so a missing secret degrades to coarser uniqueness
  // rather than throwing. Set ADMIN_SESSION_SECRET in production.
  const secret =
    process.env.VISITOR_SALT ?? process.env.ADMIN_SESSION_SECRET ?? "unsalted";

  const data = new TextEncoder().encode(`${ip}|${ua}|${date}|${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .slice(0, 16) // 128 bits is far more than enough to avoid collisions here
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hostname only. A full referrer URL can carry a session token or a search
 * query in its parameters, and none of that is wanted or needed.
 */
export function referrerHost(referrer: string | null, selfHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (!host || host === selfHost.replace(/^www\./, "")) return null;
    return host.slice(0, 80);
  } catch {
    return null;
  }
}

/** Only real site routes are counted; anything odd is rejected outright. */
export function normalisePath(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/")) return null;
  if (raw.length > 120) return null;
  // Strip query and hash so /work?x=1 and /work are one row.
  const path = raw.split(/[?#]/)[0]!;
  if (!/^[a-z0-9/_-]*$/i.test(path)) return null;
  if (path.startsWith("/admin") || path.startsWith("/api")) return null;
  return path === "" ? "/" : path.replace(/\/$/, "") || "/";
}
