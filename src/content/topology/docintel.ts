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

/**
 * The L0→L5 progression, taken from the level table in the repo's README and
 * the per-level notes in docs/architecture.md.
 *
 * An earlier version of this list was off by one: it opened at L0 with the
 * Cloud Run container, which the repo has at L1, and it invented a level for
 * schema-constrained output that actually lands inside L2. The levels are the
 * organising idea of this project, so getting their boundaries wrong misread
 * the thing it is trying to show.
 */
export const docintelLevels = [
  { level: "L0", title: "Foundations", note: "Project, APIs, repo, and a $10 monthly budget with alerts at 50, 90 and 100 percent. An alert, not a hard cap." },
  { level: "L1", title: "API and a model", note: "FastAPI /ask calling Gemini, containerised onto Cloud Run through Artifact Registry." },
  { level: "L2", title: "Storage", note: "Upload to Cloud Storage, schema-constrained analysis, the record in Firestore." },
  { level: "L3", title: "Async", note: "Bucket notification to Pub/Sub to a gen2 Cloud Function. Processing becomes done without the caller waiting." },
  { level: "L4", title: "Frontend and ops", note: "Web UI, Cloud Scheduler over OIDC, uptime checks, and the shared editor role retired for per-service accounts." },
  { level: "L5", title: "Production polish", note: "Processor rewritten in Go, Cloud Build on push to main, and Terraform that imported the topic created by hand in L3." },
  { level: "+", title: "The AI layer", note: "Firestore vector search, a self-correcting RAG graph, then a supervisor multi-agent with threaded memory. Built after L5 rather than planned into it." },
] as const;

/**
 * The agent half. Two topologies rather than one because these share almost no
 * infrastructure with the upload pipeline: that half is storage and events,
 * this half is routing and tools.
 *
 * The rule the diagram exists to show is the split down the middle. Exact
 * figures come from BigQuery over text-to-SQL; narrative comes from Firestore
 * vector search. Numbers are never read out of an embedding.
 */
export const docintelAgentTopology: Topology = {
  id: "docintel-agent",
  width: 1220,
  height: 600,
  groups: [
    {
      id: "specialists",
      label: "Four ReAct specialists · one per data boundary",
      x: 330,
      y: 60,
      width: 330,
      height: 400,
    },
    {
      id: "exact",
      label: "Exact figures · text-to-SQL, SELECT only",
      x: 760,
      y: 60,
      width: 330,
      height: 180,
    },
  ],
  nodes: [
    // Staggered rather than side by side: on one row these two labels overlap,
    // and the question's centred label ran off the left edge of the canvas.
    { id: "user", label: "Question", meta: "threaded memory", x: 105, y: 180, kind: "source", key: true },
    { id: "super", label: "Supervisor", meta: "one specialist per turn", x: 250, y: 295, kind: "compute", key: true },

    { id: "fin", label: "financials_analyst", meta: "text-to-SQL", x: 495, y: 130, kind: "model", key: true },
    { id: "comp", label: "complaints_analyst", meta: "SQL and vector search", x: 495, y: 240, kind: "model", key: true },
    { id: "lib", label: "document_librarian", meta: "vector search", x: 495, y: 350, kind: "model", key: true },
    { id: "gen", label: "general_assistant", meta: "no tools", x: 495, y: 430, kind: "model" },

    { id: "bq", label: "BigQuery", meta: "financials · 150 CFPB complaints", x: 925, y: 150, kind: "store", key: true },
    { id: "vec", label: "Firestore vectors", meta: "narratives · handbook · uploads", x: 925, y: 320, kind: "store", key: true },

    { id: "synth", label: "Synthesizer", meta: "grounded answer, names its agent", x: 330, y: 540, kind: "compute", key: true },
    { id: "abstain", label: "Abstain", meta: "distance gate · groundedness check", x: 760, y: 500, kind: "observe", key: true },
  ],
  edges: [
    { from: "user", to: "super", kind: "sync" },
    { from: "super", to: "fin", kind: "async" },
    { from: "super", to: "comp", kind: "async" },
    { from: "super", to: "lib", kind: "async" },
    { from: "super", to: "gen", kind: "async" },

    { from: "fin", to: "bq", kind: "sync" },
    { from: "comp", to: "bq", kind: "sync", bend: 30 },
    { from: "comp", to: "vec", kind: "sync", bend: -30 },
    { from: "lib", to: "vec", kind: "sync" },

    { from: "vec", to: "abstain", kind: "dlq" },
    { from: "super", to: "synth", kind: "async", bend: 40 },
  ],
  flow: ["user", "super", "comp", "bq"],
};
