/**
 * View counters, behind a narrow interface with two implementations.
 *
 * No SDK: Upstash exposes a REST API and its /pipeline endpoint takes an array
 * of commands, which is all this needs. That keeps the dependency count at zero
 * and makes the exact Redis commands visible at the call site.
 *
 * Data shape, chosen so the dashboard never has to SCAN:
 *   pv:total          string   every page view
 *   pv:paths          hash     path -> count
 *   pv:days           hash     YYYY-MM-DD -> count
 *   pv:refs           hash     referrer hostname -> count
 *   pv:uniq:<date>    HLL      hashed visitor ids, 90 day TTL
 *
 * Unique visitors use HyperLogLog rather than a set. PFADD stores a probabilistic
 * sketch, so the cardinality is recoverable but the members are not: there is no
 * stored value that can be turned back into a visitor. Combined with a salt that
 * rotates daily (see visitor.ts) that means nobody can be followed across days,
 * including by me.
 */

export interface ViewSnapshot {
  total: number;
  paths: { path: string; count: number }[];
  days: { date: string; views: number; uniques: number }[];
  refs: { host: string; count: number }[];
  configured: boolean;
}

export interface ViewStore {
  readonly configured: boolean;
  record(input: {
    path: string;
    refHost: string | null;
    visitorId: string;
    date: string;
  }): Promise<void>;
  snapshot(days: number): Promise<ViewSnapshot>;
}

const UNIQ_TTL_SECONDS = 60 * 60 * 24 * 90;

/* ── Upstash REST ──────────────────────────────────────────────────────── */

type Command = (string | number)[];

class UpstashStore implements ViewStore {
  readonly configured = true;

  constructor(
    private url: string,
    private token: string,
  ) {}

  private async pipeline(commands: Command[]): Promise<unknown[]> {
    const res = await fetch(`${this.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`upstash ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as { result?: unknown; error?: string }[];
    const failed = json.find((r) => r.error);
    if (failed) throw new Error(`upstash command failed: ${failed.error}`);
    return json.map((r) => r.result);
  }

  async record({
    path,
    refHost,
    visitorId,
    date,
  }: Parameters<ViewStore["record"]>[0]) {
    const key = `pv:uniq:${date}`;
    const commands: Command[] = [
      ["INCR", "pv:total"],
      ["HINCRBY", "pv:paths", path, 1],
      ["HINCRBY", "pv:days", date, 1],
      ["PFADD", key, visitorId],
      // Refreshed on every write, so the window slides rather than expiring
      // mid-day and losing the running count.
      ["EXPIRE", key, UNIQ_TTL_SECONDS],
    ];
    if (refHost) commands.push(["HINCRBY", "pv:refs", refHost, 1]);
    await this.pipeline(commands);
  }

  async snapshot(days: number): Promise<ViewSnapshot> {
    const dates = recentDates(days);
    const [total, pathsRaw, daysRaw, refsRaw, ...uniqCounts] =
      await this.pipeline([
        ["GET", "pv:total"],
        ["HGETALL", "pv:paths"],
        ["HGETALL", "pv:days"],
        ["HGETALL", "pv:refs"],
        ...dates.map((d): Command => ["PFCOUNT", `pv:uniq:${d}`]),
      ]);

    const dayViews = flatToMap(daysRaw);
    return {
      configured: true,
      total: Number(total ?? 0),
      paths: sortedEntries(flatToMap(pathsRaw)).map(([path, count]) => ({
        path,
        count,
      })),
      refs: sortedEntries(flatToMap(refsRaw)).map(([host, count]) => ({
        host,
        count,
      })),
      days: dates.map((date, i) => ({
        date,
        views: dayViews.get(date) ?? 0,
        uniques: Number(uniqCounts[i] ?? 0),
      })),
    };
  }
}

/**
 * HGETALL comes back as a flat [field, value, field, value] array over REST,
 * not an object.
 */
function flatToMap(raw: unknown): Map<string, number> {
  const out = new Map<string, number>();
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i < raw.length - 1; i += 2) {
    out.set(String(raw[i]), Number(raw[i + 1]) || 0);
  }
  return out;
}

function sortedEntries(m: Map<string, number>): [string, number][] {
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

/* ── In-memory, for local development ──────────────────────────────────── */

interface MemoryState {
  total: number;
  paths: Map<string, number>;
  days: Map<string, number>;
  refs: Map<string, number>;
  uniq: Map<string, Set<string>>;
}

/**
 * State hangs off globalThis rather than this module.
 *
 * Next compiles server code into several layers, and a route handler and a
 * Server Component end up holding *different instances* of the same module. A
 * plain module-level counter therefore records views in one graph and reads
 * zeros from the other, which is exactly what happened the first time this ran.
 * globalThis is shared across all of them within one process.
 */
function memoryState(): MemoryState {
  const g = globalThis as unknown as { __pfViewCounts?: MemoryState };
  g.__pfViewCounts ??= {
    total: 0,
    paths: new Map(),
    days: new Map(),
    refs: new Map(),
    uniq: new Map(),
  };
  return g.__pfViewCounts;
}

/**
 * Survives within one server process and nothing else: it resets on restart,
 * and on a serverless platform each instance counts separately. Present so the
 * admin page works locally before any infrastructure exists, and so a missing
 * env var degrades to "unconfigured" rather than a 500.
 */
class MemoryStore implements ViewStore {
  readonly configured = false;

  async record({
    path,
    refHost,
    visitorId,
    date,
  }: Parameters<ViewStore["record"]>[0]) {
    const s = memoryState();
    s.total += 1;
    bump(s.paths, path);
    bump(s.days, date);
    if (refHost) bump(s.refs, refHost);
    if (!s.uniq.has(date)) s.uniq.set(date, new Set());
    s.uniq.get(date)!.add(visitorId);
  }

  async snapshot(days: number): Promise<ViewSnapshot> {
    const s = memoryState();
    return {
      configured: false,
      total: s.total,
      paths: sortedEntries(s.paths).map(([path, count]) => ({ path, count })),
      refs: sortedEntries(s.refs).map(([host, count]) => ({ host, count })),
      days: recentDates(days).map((date) => ({
        date,
        views: s.days.get(date) ?? 0,
        uniques: s.uniq.get(date)?.size ?? 0,
      })),
    };
  }
}

function bump(m: Map<string, number>, k: string) {
  m.set(k, (m.get(k) ?? 0) + 1);
}

/* ── Shared helpers ───────────────────────────────────────────────────── */

/** UTC so the day boundary does not move with the reader's timezone. */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function recentDates(count: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    out.push(new Date(now - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

let cached: ViewStore | null = null;

export function getViewStore(): ViewStore {
  if (cached) return cached;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  cached =
    url && token ? new UpstashStore(url, token) : new MemoryStore();
  return cached;
}
