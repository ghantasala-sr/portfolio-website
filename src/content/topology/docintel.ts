import type { Topology } from "./types";

/**
 * Cross-checked against the repo's own committed diagrams
 * (docs/architecture-high-level.svg and -low-level.svg).
 *
 * The shape that matters: the upload path returns before any model work
 * happens, and the processor is reached only through a storage notification
 * on Pub/Sub. Both halves write to the same Firestore document.
 */
export const docintelTopology: Topology = {
  id: "docintel",
  width: 1140,
  height: 480,
  groups: [
    {
      id: "sync",
      label: "Request path · returns immediately",
      x: 150,
      y: 40,
      width: 420,
      height: 150,
    },
    {
      id: "async",
      label: "Event path · decoupled, retryable, invisible to the caller",
      x: 150,
      y: 240,
      width: 810,
      height: 190,
    },
  ],
  nodes: [
    { id: "browser", label: "Browser", meta: "upload · then poll", x: 60, y: 115, kind: "source", key: true },
    { id: "run", label: "Cloud Run · FastAPI", meta: "POST /upload → 202", x: 290, y: 115, kind: "compute", key: true },
    { id: "gcs", label: "Cloud Storage", meta: "docintel-…-uploads", x: 490, y: 115, kind: "store", key: true },

    { id: "pubsub", label: "Pub/Sub", meta: "topic: document-uploads", x: 330, y: 320, kind: "topic", key: true },
    { id: "fn", label: "Cloud Function · Go", meta: "gen2 · go126 · rewritten from Python", x: 560, y: 320, kind: "compute", key: true },
    { id: "vertex", label: "Vertex AI · Gemini 2.5 Flash", meta: "response_schema · reads gs:// directly", x: 820, y: 320, kind: "model", key: true },
    { id: "dlq", label: "Dead-letter topic", meta: "no subscription yet", x: 560, y: 415, kind: "queue" },

    { id: "fs", label: "Firestore", meta: "one doc: processing → done", x: 700, y: 170, kind: "store", key: true },
    { id: "sched", label: "Cloud Scheduler", meta: "OIDC → /tasks/stats", x: 990, y: 100, kind: "source" },
    { id: "mon", label: "Cloud Monitoring", meta: "uptime check + email alert", x: 990, y: 210, kind: "observe" },
  ],
  edges: [
    { from: "browser", to: "run", kind: "sync" },
    { from: "run", to: "gcs", kind: "data" },
    { from: "run", to: "fs", kind: "data", bend: -30 },
    { from: "gcs", to: "pubsub", kind: "async", bend: 60 },
    { from: "pubsub", to: "fn", kind: "async" },
    { from: "fn", to: "vertex", kind: "sync" },
    { from: "vertex", to: "fs", kind: "data", bend: -50 },
    { from: "fn", to: "dlq", kind: "dlq" },
    { from: "sched", to: "run", kind: "sync", bend: 70 },
    { from: "run", to: "mon", kind: "async", bend: -60 },
  ],
  flow: ["browser", "run", "gcs", "pubsub", "fn", "vertex", "fs"],
};

/** The L0→L5 progression, from docs/architecture.md. */
export const docintelLevels = [
  { level: "L0", title: "One container on Cloud Run", note: "Get it deployed at all." },
  { level: "L1", title: "Storage + Firestore", note: "Persist the upload and its record." },
  { level: "L2", title: "Decouple via Pub/Sub", note: "Return before the model runs." },
  { level: "L3", title: "Schema-constrained Gemini", note: "Typed output instead of parsed prose." },
  { level: "L4", title: "Least-privilege IAM", note: "Retire the broad editor role for per-service accounts." },
  { level: "L5", title: "CI + Terraform + Go rewrite", note: "Cloud Build on main; imported existing infra into Terraform." },
] as const;
