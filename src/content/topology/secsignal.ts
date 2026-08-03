import type { Topology } from "./types";

/**
 * Drawn from secsignal/agents/graph.py.
 *
 * Note the README's diagram draws ROUTE_PLAN as a node. In code it is the
 * conditional-edge function on classify_query that emits one dispatch per
 * planned agent, so it is a router on the edge, not a graph node. Drawing it
 * as a box would document something that does not exist.
 */
export const secsignalTopology: Topology = {
  id: "secsignal",
  width: 1200,
  height: 560,
  groups: [
    {
      id: "agents",
      label: "8 specialist agents · dispatched per execution plan · results merged",
      x: 500,
      y: 30,
      width: 270,
      height: 500,
    },
  ],
  nodes: [
    { id: "ui", label: "Next.js client", meta: "SSE · incremental render", x: 60, y: 280, kind: "source", key: true },
    { id: "api", label: "FastAPI", meta: "10 req/min · rate limited", x: 190, y: 280, kind: "compute" },
    { id: "guard", label: "Guardrails", meta: "pre-graph · Cortex", x: 310, y: 280, kind: "compute", key: true },
    { id: "classify", label: "classify_query", meta: "tickers · range · plan", x: 430, y: 280, kind: "compute", key: true },

    { id: "trend", label: "trend", x: 590, y: 60, kind: "compute" },
    { id: "compare", label: "comparison", x: 590, y: 118, kind: "compute" },
    { id: "anomaly", label: "anomaly", meta: "z-score", x: 590, y: 176, kind: "compute" },
    { id: "valuation", label: "valuation", x: 590, y: 234, kind: "compute" },
    { id: "sentiment", label: "sentiment", x: 590, y: 292, kind: "compute" },
    { id: "peer", label: "peer group", x: 590, y: 350, kind: "compute" },
    { id: "general", label: "general", x: 590, y: 408, kind: "compute" },
    { id: "web", label: "web search", meta: "unknown-ticker fallback", x: 590, y: 480, kind: "compute", key: true },

    { id: "sql", label: "SQL over marts", meta: "fct_financials · fct_risk_factors", x: 800, y: 130, kind: "store", key: true },
    { id: "search", label: "Cortex Search", meta: "1024-d embeddings", x: 800, y: 300, kind: "store", key: true },
    { id: "webapi", label: "Cortex Agent", meta: "web", x: 800, y: 470, kind: "model" },

    { id: "synth", label: "synthesizer", meta: "cite + chart spec", x: 970, y: 280, kind: "compute", key: true },
    { id: "answer", label: "Cited answer", meta: "streamed", x: 1120, y: 200, kind: "sink", key: true },
    { id: "evals", label: "Eval harness", meta: "4 dimensions · LLM judge + heuristics", x: 1100, y: 400, kind: "observe", key: true },
  ],
  edges: [
    { from: "ui", to: "api", kind: "sync" },
    { from: "api", to: "guard", kind: "sync" },
    { from: "guard", to: "classify", kind: "sync" },

    { from: "classify", to: "trend", kind: "async" },
    { from: "classify", to: "compare", kind: "async" },
    { from: "classify", to: "anomaly", kind: "async" },
    { from: "classify", to: "valuation", kind: "async" },
    { from: "classify", to: "sentiment", kind: "async" },
    { from: "classify", to: "peer", kind: "async" },
    { from: "classify", to: "general", kind: "async" },
    { from: "classify", to: "web", kind: "async" },

    { from: "trend", to: "sql", kind: "data" },
    { from: "compare", to: "sql", kind: "data" },
    { from: "anomaly", to: "sql", kind: "data" },
    { from: "valuation", to: "sql", kind: "data" },
    { from: "sentiment", to: "search", kind: "data" },
    { from: "peer", to: "search", kind: "data" },
    { from: "general", to: "search", kind: "data" },
    { from: "web", to: "webapi", kind: "data" },

    { from: "sql", to: "synth", kind: "data" },
    { from: "search", to: "synth", kind: "data" },
    { from: "webapi", to: "synth", kind: "data" },
    { from: "synth", to: "answer", kind: "sync" },
    { from: "synth", to: "evals", kind: "async", bend: -30 },
  ],
  flow: ["ui", "api", "guard", "classify", "compare", "sql", "synth", "answer"],
};
