import type { Topology } from "./types";

/**
 * The BFF request pipeline, drawn in execution order.
 *
 * Ordering is the whole point of this diagram: the cheap config predicates run
 * first and cut 10,000 campaigns to a few hundred, so the expensive Int32Array
 * rollup only ever scans survivors, and the two page-scoped upstreams are
 * reached only after the result has been sliced to 50 rows. Drawn as an
 * unordered fan-out it would look like four equal calls, which is exactly the
 * design this avoids.
 *
 * The budget branch is drawn as its own path because partial failure is a
 * first-class route here rather than an error case.
 */
export const adsightTopology: Topology = {
  id: "adsight",
  width: 1240,
  height: 620,
  groups: [
    {
      id: "cheap",
      label: "Cheap predicates first · 10,000 to a few hundred",
      x: 250,
      y: 60,
      width: 330,
      height: 170,
    },
    {
      id: "paged",
      label: "Page-scoped · runs on 50 rows, batched",
      x: 800,
      y: 330,
      width: 330,
      height: 200,
    },
  ],
  nodes: [
    { id: "browser", label: "Browser", meta: "REST · GraphQL · SSE", x: 70, y: 150, kind: "source", key: true },
    { id: "web", label: "Cloud Run · web", meta: "Next.js standalone", x: 70, y: 300, kind: "compute" },

    { id: "configs", label: "campaignService", meta: "10,000 configs · cacheable", x: 330, y: 130, kind: "compute", key: true },
    { id: "filter", label: "Filter on config", meta: "status · country · supply", x: 500, y: 190, kind: "compute", key: true },

    { id: "rollup", label: "reportingService", meta: "contiguous Int32Array scan", x: 680, y: 250, kind: "store", key: true },
    { id: "rank", label: "Predicates · sort · slice", meta: "one page of 50", x: 680, y: 400, kind: "compute", key: true },

    { id: "catalog", label: "catalogService", meta: "batched by adamId", x: 960, y: 390, kind: "compute" },
    { id: "budget", label: "budgetService", meta: "fails 6% by default", x: 960, y: 480, kind: "compute", key: true },

    { id: "rows", label: "CampaignRow[]", meta: "+ totals over the filtered set", x: 1160, y: 250, kind: "sink", key: true },
    { id: "degraded", label: "meta.degraded", meta: "pacing null · banner, not an error", x: 1160, y: 560, kind: "observe", key: true },

    { id: "gemini", label: "Gemini 2.5 Flash", meta: "propose_filter · never applies", x: 330, y: 470, kind: "model", key: true },
    { id: "review", label: "Human accepts", meta: "chips · Apply or Discard", x: 530, y: 560, kind: "sink", key: true },
  ],
  edges: [
    { from: "browser", to: "web", kind: "sync" },
    { from: "browser", to: "configs", kind: "sync" },
    { from: "configs", to: "filter", kind: "data" },
    { from: "filter", to: "rollup", kind: "data" },
    { from: "rollup", to: "rank", kind: "data" },
    { from: "rank", to: "catalog", kind: "sync" },
    { from: "rank", to: "budget", kind: "sync" },
    { from: "catalog", to: "rows", kind: "data" },
    // Bent clear of the catalog node, which sits directly on the straight line
    // from budget to rows. Anything from 40 up misses it; 60 is the gentlest
    // arc that reads as deliberate routing rather than a wobble.
    { from: "budget", to: "rows", kind: "data", bend: 60 },
    { from: "budget", to: "degraded", kind: "dlq", bend: 40 },

    { from: "browser", to: "gemini", kind: "async", bend: -70 },
    { from: "gemini", to: "review", kind: "async" },
    // -90 rather than -120: the deeper arc clipped the Gemini label.
    { from: "review", to: "filter", kind: "async", bend: -90 },
  ],
  flow: ["browser", "configs", "filter", "rollup", "rank", "catalog", "rows"],
};

/**
 * Median of 5 headless-Chromium runs on a production build, committed in
 * perf/render.json. The naive variant is the natural first implementation:
 * every row in the DOM, no memoization, a fresh Intl.NumberFormat per cell and
 * one <circle> per sparkline point.
 */
export const adsightRender = [
  { rows: 1000, naiveMountMs: 583.3, optimizedMountMs: 33.3, naiveNodes: 51025, optimizedNodes: 553 },
  { rows: 5000, naiveMountMs: 2756.5, optimizedMountMs: 33.9, naiveNodes: 255025, optimizedNodes: 523 },
  { rows: 10000, naiveMountMs: 6472.4, optimizedMountMs: 34.1, naiveNodes: 510025, optimizedNodes: 463 },
] as const;
