import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  adminConfigured,
  createSessionToken,
  verifyPassword,
} from "@/lib/admin/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A password form is the one endpoint here worth attacking, so it is rate
 * limited per IP. Without a limit, a short password is guessable at HTTP speed.
 *
 * The counter lives in Redis when configured and in this module otherwise. The
 * in-process fallback is weaker (it resets on cold start and is per-instance)
 * but it is strictly better than nothing for local use, and production has Redis.
 */
const MAX_ATTEMPTS = 8;
const WINDOW_SECONDS = 15 * 60;

const localAttempts = new Map<string, { count: number; resetAt: number }>();

async function tooManyAttempts(ip: string): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const key = `admin:attempts:${ip}`;

  if (url && token) {
    try {
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, WINDOW_SECONDS, "NX"],
        ]),
        cache: "no-store",
      });
      const json = (await res.json()) as { result?: unknown }[];
      return Number(json[0]?.result ?? 0) > MAX_ATTEMPTS;
    } catch {
      return false; // storage trouble must not lock the owner out
    }
  }

  const now = Date.now();
  const entry = localAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    localAttempts.set(ip, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

/**
 * Cleared on success, so the limit only ever counts *failures* in a row. Without
 * this, signing in and out a few times to check something would lock the owner
 * out of their own dashboard for 15 minutes.
 */
async function clearAttempts(ip: string): Promise<void> {
  localAttempts.delete(ip);
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([["DEL", `admin:attempts:${ip}`]]),
      cache: "no-store",
    });
  } catch {
    // A stale counter expires on its own; nothing to recover here.
  }
}

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return Response.json(
      { error: "Admin is not configured on this deployment." },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (await tooManyAttempts(ip)) {
    return Response.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const password =
    typeof body === "object" && body !== null
      ? (body as { password?: unknown }).password
      : undefined;

  if (typeof password !== "string" || !(await verifyPassword(password))) {
    // Identical message and status whether the password was wrong or malformed,
    // so nothing is learned from the difference.
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  await clearAttempts(ip);

  const { value, maxAge } = await createSessionToken();
  (await cookies()).set(SESSION_COOKIE, value, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge,
  });

  return Response.json({ ok: true });
}
