"use client";

import { useRouter } from "next/navigation";
import type { ViewSnapshot } from "@/lib/analytics/store";

export function Dashboard({ data }: { data: ViewSnapshot }) {
  const router = useRouter();

  const windowViews = data.days.reduce((s, d) => s + d.views, 0);
  const peak = Math.max(1, ...data.days.map((d) => d.views));
  const busiest = data.days.reduce((a, b) => (b.views > a.views ? b : a), data.days[0]);
  const uniquesToday = data.days.at(-1)?.uniques ?? 0;

  return (
    <div className="shell py-32">
      <div className="mb-12 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="label mb-3">Private · not indexed</p>
          <h1 className="text-d2">Traffic</h1>
        </div>
        <button
          type="button"
          data-cursor="link"
          onClick={async () => {
            await fetch("/api/admin/logout", { method: "POST" });
            router.refresh();
          }}
          className="label border border-line px-3 py-2 transition-colors hover:border-line-strong hover:text-text"
        >
          Sign out
        </button>
      </div>

      {!data.configured && (
        <p
          className="mb-12 border-l-2 pl-4 text-[0.9375rem] leading-relaxed"
          style={{ borderColor: "var(--warn)", color: "var(--text-dim)" }}
        >
          No datastore is connected, so these counts live in memory and reset
          whenever the server restarts. Set{" "}
          <span className="font-mono">UPSTASH_REDIS_REST_URL</span> and{" "}
          <span className="font-mono">UPSTASH_REDIS_REST_TOKEN</span> to persist
          them.
        </p>
      )}

      {/* Headline numbers */}
      <dl className="mb-16 grid gap-x-12 gap-y-8 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total views", value: data.total, detail: "since first deploy" },
          { label: "Last 30 days", value: windowViews, detail: "page views" },
          { label: "Unique today", value: uniquesToday, detail: "distinct visitors, UTC" },
          {
            label: "Busiest day",
            value: busiest?.views ?? 0,
            detail: busiest?.date ?? "",
          },
        ].map((s) => (
          <div key={s.label}>
            <dd
              className="font-mono text-[2rem] font-medium leading-none"
              style={{ color: "var(--accent)" }}
            >
              {s.value.toLocaleString()}
            </dd>
            <dt className="mt-3 text-[0.9375rem]">{s.label}</dt>
            <p className="label mt-1" style={{ color: "var(--faint)" }}>
              {s.detail}
            </p>
          </div>
        ))}
      </dl>

      {/* Daily trend. A bar chart rather than a sparkline: 30 discrete days are
          countable, and a bar makes a zero-view day visible where a line would
          just dip. */}
      <section className="mb-16">
        <p className="label mb-6 border-b border-line pb-3">Last 30 days</p>
        <div className="flex h-40 items-end gap-[3px]" role="img"
             aria-label={`Daily page views for the last 30 days. Peak ${peak} on ${busiest?.date}.`}>
          {data.days.map((d) => (
            <div
              key={d.date}
              className="group relative flex-1"
              style={{ height: "100%" }}
            >
              <div className="absolute bottom-0 w-full" style={{ height: "100%" }}>
                <div
                  className="absolute bottom-0 w-full transition-[height] duration-500"
                  style={{
                    height: `${Math.max(2, (d.views / peak) * 100)}%`,
                    background:
                      d.views > 0 ? "var(--accent)" : "var(--line-strong)",
                    opacity: d.views > 0 ? 0.85 : 1,
                  }}
                />
              </div>
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap border px-1.5 py-1 font-mono text-[0.625rem] group-hover:block"
                    style={{ borderColor: "var(--line-strong)", background: "var(--bg)" }}>
                {d.date.slice(5)} · {d.views}v · {d.uniques}u
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between">
          <span className="label" style={{ color: "var(--faint)" }}>
            {data.days[0]?.date}
          </span>
          <span className="label" style={{ color: "var(--faint)" }}>
            {data.days.at(-1)?.date}
          </span>
        </div>
      </section>

      <div className="grid gap-x-14 gap-y-12 lg:grid-cols-2">
        <Table
          title="Most read"
          empty="No page views recorded yet."
          rows={data.paths.slice(0, 14).map((p) => [p.path, p.count])}
          total={data.total}
        />
        <Table
          title="Referrers"
          empty="No external referrers yet. Direct visits and link previews that strip the header do not appear here."
          rows={data.refs.slice(0, 14).map((r) => [r.host, r.count])}
          total={data.refs.reduce((s, r) => s + r.count, 0)}
        />
      </div>

      <p
        className="mt-16 border-t border-line pt-6 text-[0.875rem] leading-relaxed"
        style={{ color: "var(--muted)" }}
      >
        Counts exclude self-identified bots and any visit to this admin area. No
        IP address, user agent or cookie is stored for visitors: unique counts
        come from a HyperLogLog sketch of a salted daily hash, so the figures are
        recoverable but the people are not. Uniques are per day by construction
        and cannot be summed across the month.
      </p>
    </div>
  );
}

function Table({
  title,
  rows,
  total,
  empty,
}: {
  title: string;
  rows: [string, number][];
  total: number;
  empty: string;
}) {
  return (
    <section>
      <p className="label mb-6 border-b border-line pb-3">{title}</p>
      {rows.length === 0 ? (
        <p className="text-[0.9375rem] leading-relaxed text-text-dim">{empty}</p>
      ) : (
        <ol>
          {rows.map(([label, count]) => (
            <li
              key={label}
              className="relative border-b border-line py-3"
            >
              {/* Proportion bar behind the row, so scanning is possible without
                  reading the numbers. */}
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${total > 0 ? (count / total) * 100 : 0}%`,
                  background: "var(--accent)",
                  opacity: 0.07,
                }}
              />
              <div className="relative flex items-baseline justify-between gap-4">
                <span className="truncate font-mono text-[0.875rem]">
                  {label}
                </span>
                <span className="shrink-0 font-mono text-[0.875rem] tabular-nums" style={{ color: "var(--accent)" }}>
                  {count.toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
