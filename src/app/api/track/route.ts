import { getViewStore, todayUtc } from "@/lib/analytics/store";
import {
  isBot,
  normalisePath,
  referrerHost,
  visitorId,
} from "@/lib/analytics/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One page view. Deliberately forgiving: this is a side channel, so any failure
 * returns 204 and is swallowed rather than surfacing to the visitor. Nothing on
 * the site depends on it succeeding.
 */
export async function POST(request: Request) {
  try {
    if (isBot(request.headers.get("user-agent"))) {
      return new Response(null, { status: 204 });
    }

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return new Response(null, { status: 204 });
    }

    const { path: rawPath, ref } = body as { path?: unknown; ref?: unknown };
    const path = normalisePath(rawPath);
    if (!path) return new Response(null, { status: 204 });

    const date = todayUtc();
    const store = getViewStore();

    await store.record({
      path,
      refHost: referrerHost(
        typeof ref === "string" ? ref : null,
        new URL(request.url).hostname,
      ),
      visitorId: await visitorId(request.headers, date),
      date,
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    // Never let analytics break a page load, and never leak why it failed to the
    // visitor. It still has to be diagnosable though: swallowing this entirely
    // made a bad Upstash credential indistinguishable from a working one, since
    // both paths return 204. The message carries the status and body of the
    // failed Redis call, never the token, which travels in a header.
    console.error("[track] failed to record view:", err);
    return new Response(null, { status: 204 });
  }
}
