import type { Topology } from "./types";

/**
 * Compact topologies for projects without a full case-study diagram. Each is
 * still the real shape of the system, just at the resolution a glyph needs
 * enough that a card communicates the architecture rather than decorating it.
 */

export const glassboxTopology: Topology = {
  id: "glassbox",
  width: 640,
  height: 300,
  nodes: [
    { id: "client", label: "Client", x: 50, y: 90, kind: "source", key: true },
    { id: "api", label: "FastAPI /ask", meta: "server span", x: 200, y: 90, kind: "compute", key: true },
    { id: "gemini", label: "Gemini", meta: "gemini_api_call span · tokens · cost", x: 400, y: 90, kind: "model", key: true },
    { id: "otel", label: "3 signals", meta: "traces · 8 metrics · logs", x: 250, y: 220, kind: "observe", key: true },
    { id: "signoz", label: "SigNoz", meta: "11 panels · 3 alerts", x: 480, y: 220, kind: "observe", key: true },
  ],
  edges: [
    { from: "client", to: "api", kind: "sync" },
    { from: "api", to: "gemini", kind: "sync" },
    { from: "api", to: "otel", kind: "async", bend: 30 },
    { from: "otel", to: "signoz", kind: "data" },
  ],
  flow: ["client", "api", "gemini"],
};

export const mealmindTopology: Topology = {
  id: "mealmind",
  width: 660,
  height: 320,
  nodes: [
    { id: "usda", label: "USDA via S3", x: 50, y: 70, kind: "source", key: true },
    { id: "dbt", label: "dbt → Snowflake", meta: "staging → marts", x: 200, y: 70, kind: "compute", key: true },
    { id: "mcp", label: "MCP server", meta: "meal-mind-search tool", x: 390, y: 70, kind: "topic", key: true },
    { id: "router", label: "LangGraph router", meta: "10 nodes", x: 390, y: 180, kind: "compute", key: true },
    { id: "app", label: "Streamlit", x: 200, y: 180, kind: "sink" },
    { id: "eval", label: "Eval DAG", meta: "daily · judged · run_id + model_version", x: 400, y: 275, kind: "observe", key: true },
  ],
  edges: [
    { from: "usda", to: "dbt", kind: "data" },
    { from: "dbt", to: "mcp", kind: "data" },
    { from: "mcp", to: "router", kind: "sync" },
    { from: "router", to: "app", kind: "sync" },
    { from: "router", to: "eval", kind: "async", bend: -20 },
  ],
  flow: ["usda", "dbt", "mcp", "router", "app"],
};

export const careiqTopology: Topology = {
  id: "careiq",
  width: 700,
  height: 260,
  nodes: [
    { id: "q", label: "Question", x: 45, y: 130, kind: "source", key: true },
    { id: "mask", label: "PHI mask", meta: "Presidio · first stage, always", x: 165, y: 130, kind: "compute", key: true },
    { id: "guard", label: "Guardrails", x: 300, y: 130, kind: "compute", key: true },
    { id: "rag", label: "Retrieve", meta: "Voyage → Pinecone", x: 420, y: 130, kind: "store", key: true },
    { id: "gen", label: "Cited generation", meta: "Claude citations API", x: 550, y: 80, kind: "model", key: true },
    { id: "faith", label: "Faithfulness check", x: 550, y: 200, kind: "observe", key: true },
    { id: "audit", label: "BigQuery audit", x: 660, y: 200, kind: "store" },
  ],
  edges: [
    { from: "q", to: "mask", kind: "sync" },
    { from: "mask", to: "guard", kind: "sync" },
    { from: "guard", to: "rag", kind: "sync" },
    { from: "rag", to: "gen", kind: "sync" },
    { from: "gen", to: "faith", kind: "sync" },
    { from: "faith", to: "audit", kind: "data" },
  ],
  flow: ["q", "mask", "guard", "rag", "gen", "faith"],
};

export const datapilotTopology: Topology = {
  id: "datapilot",
  width: 680,
  height: 240,
  nodes: [
    { id: "nl", label: "Question", x: 45, y: 120, kind: "source", key: true },
    { id: "intent", label: "Intent", x: 160, y: 120, kind: "compute" },
    { id: "onto", label: "Ontology layer", meta: "metrics · joins · policy", x: 300, y: 120, kind: "store", key: true },
    { id: "gen", label: "Gemini → SQL", x: 450, y: 120, kind: "model", key: true },
    { id: "valid", label: "Validate", meta: "guardrails · PII · dry-run cost", x: 570, y: 60, kind: "observe", key: true },
    { id: "bq", label: "BigQuery", x: 600, y: 190, kind: "store", key: true },
  ],
  edges: [
    { from: "nl", to: "intent", kind: "sync" },
    { from: "intent", to: "onto", kind: "sync" },
    { from: "onto", to: "gen", kind: "sync" },
    { from: "gen", to: "valid", kind: "sync" },
    { from: "valid", to: "bq", kind: "sync" },
  ],
  flow: ["nl", "intent", "onto", "gen", "valid", "bq"],
};

export const myclawTopology: Topology = {
  id: "myclaw",
  width: 660,
  height: 300,
  nodes: [
    { id: "discord", label: "Discord", meta: "signed requests", x: 50, y: 80, kind: "source", key: true },
    { id: "gw", label: "discord-gateway", x: 200, y: 80, kind: "compute" },
    { id: "api", label: "assistant-api", meta: "state · retrieval · Vertex AI", x: 370, y: 80, kind: "compute", key: true },
    { id: "approve", label: "Approval gate", meta: "no side effect executes inline", x: 540, y: 80, kind: "observe", key: true },
    { id: "gcs", label: "Upload → GCS", x: 130, y: 220, kind: "source" },
    { id: "ps", label: "Pub/Sub", x: 290, y: 220, kind: "topic", key: true },
    { id: "worker", label: "ingestion-worker", meta: "chunk + embed", x: 450, y: 220, kind: "compute", key: true },
    { id: "pg", label: "Cloud SQL", x: 590, y: 220, kind: "store" },
  ],
  edges: [
    { from: "discord", to: "gw", kind: "sync" },
    { from: "gw", to: "api", kind: "sync" },
    { from: "api", to: "approve", kind: "sync" },
    { from: "gcs", to: "ps", kind: "async" },
    { from: "ps", to: "worker", kind: "async" },
    { from: "worker", to: "pg", kind: "data" },
    { from: "api", to: "pg", kind: "data", bend: 50 },
  ],
  flow: ["discord", "gw", "api", "approve"],
};

export const aideTopology: Topology = {
  id: "aide",
  width: 620,
  height: 200,
  nodes: [
    { id: "csv", label: "CSV in browser", meta: "parsed client-side", x: 60, y: 100, kind: "source", key: true },
    { id: "react", label: "React · Vite", x: 190, y: 100, kind: "compute" },
    { id: "spring", label: "Spring Boot proxy", meta: "holds the credential", x: 350, y: 100, kind: "compute", key: true },
    { id: "prof", label: "FastAPI profiler", meta: "Claude via LangChain", x: 520, y: 100, kind: "model", key: true },
  ],
  edges: [
    { from: "csv", to: "react", kind: "sync" },
    { from: "react", to: "spring", kind: "sync" },
    { from: "spring", to: "prof", kind: "sync" },
  ],
  flow: ["csv", "react", "spring", "prof"],
};

export const campusTopology: Topology = {
  id: "campus-vitality",
  width: 600,
  height: 220,
  nodes: [
    { id: "spa", label: "React SPA", meta: "3 roles", x: 60, y: 110, kind: "source", key: true },
    { id: "api", label: "Express API", meta: "JWT", x: 220, y: 110, kind: "compute", key: true },
    { id: "mongo", label: "MongoDB", x: 380, y: 60, kind: "store", key: true },
    { id: "stripe", label: "Stripe", meta: "webhooks are the source of truth", x: 400, y: 175, kind: "sink", key: true },
  ],
  edges: [
    { from: "spa", to: "api", kind: "sync" },
    { from: "api", to: "mongo", kind: "data" },
    { from: "api", to: "stripe", kind: "sync" },
  ],
  flow: ["spa", "api", "mongo"],
};

export const subscriptionTopology: Topology = {
  id: "subscription-manager",
  width: 560,
  height: 200,
  nodes: [
    { id: "ui", label: "SwiftUI", x: 70, y: 100, kind: "source", key: true },
    { id: "fb", label: "Firebase", meta: "auth + sync", x: 230, y: 60, kind: "store", key: true },
    { id: "ml", label: "Core ML", meta: "on-device, spend never leaves", x: 250, y: 165, kind: "model", key: true },
    { id: "notif", label: "Local notifications", meta: "before renewal", x: 440, y: 100, kind: "sink", key: true },
  ],
  edges: [
    { from: "ui", to: "fb", kind: "data" },
    { from: "ui", to: "ml", kind: "sync" },
    { from: "ml", to: "notif", kind: "async" },
  ],
  flow: ["ui", "ml", "notif"],
};

export const damgTopology: Topology = {
  id: "damg-7374-labs",
  width: 700,
  height: 200,
  nodes: [
    { id: "l1", label: "L1 Snowflake", meta: "5 worksheets", x: 60, y: 100, kind: "store", key: true },
    { id: "l2", label: "L2 dbt", meta: "models · tests · macros", x: 205, y: 100, kind: "compute", key: true },
    { id: "l3", label: "L3 RAG + router", meta: "3 tools", x: 355, y: 100, kind: "compute", key: true },
    { id: "l4", label: "L4 Parallel agents", meta: "planner → executor → synth", x: 510, y: 100, kind: "compute", key: true },
    { id: "l5", label: "L5 Reflection", x: 650, y: 100, kind: "model", key: true },
  ],
  edges: [
    { from: "l1", to: "l2", kind: "data" },
    { from: "l2", to: "l3", kind: "data" },
    { from: "l3", to: "l4", kind: "data" },
    { from: "l4", to: "l5", kind: "data" },
  ],
  flow: ["l1", "l2", "l3", "l4", "l5"],
};
