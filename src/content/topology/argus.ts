import type { Topology } from "./types";

/**
 * Drawn from the CDK stacks (lib/stacks/*.ts), not the README.
 *
 * The README describes 4 agents; the deployed infrastructure is 8 Lambdas,
 * 4 SNS topics and 7 SQS queues, each queue with its own DLQ at
 * maxReceiveCount 3. The long-term-memory loop at the end is absent from the
 * README entirely and is the most interesting part of the system.
 */
export const argusTopology: Topology = {
  id: "argus",
  width: 1200,
  height: 520,
  groups: [
    {
      id: "specialists",
      label: "Specialist agents · parallel · independent failure domains",
      x: 468,
      y: 40,
      width: 300,
      height: 440,
    },
  ],
  nodes: [
    { id: "pr", label: "GitHub PR", meta: "webhook", x: 60, y: 260, kind: "source", key: true },
    { id: "api", label: "API Gateway", meta: "POST /webhook", x: 190, y: 260, kind: "compute" },
    { id: "hook", label: "webhook λ", meta: "HMAC verify · 256MB", x: 318, y: 260, kind: "compute" },
    { id: "t1", label: "pr-webhook", meta: "SNS", x: 396, y: 196, kind: "topic" },
    { id: "parseq", label: "parse-queue", meta: "+ DLQ", x: 404, y: 340, kind: "queue" },
    { id: "parser", label: "parser λ", meta: "chunk diff · 512MB · 120s", x: 404, y: 420, kind: "compute", key: true },
    { id: "t2", label: "SNS", meta: "pr-parsed · fan-out ×4", x: 468, y: 260, kind: "topic", key: true },

    { id: "qsec", label: "security-queue", x: 560, y: 90, kind: "queue" },
    { id: "sec", label: "security λ", meta: "Nova Pro · 180s", x: 700, y: 90, kind: "compute", key: true },
    { id: "qperf", label: "performance-queue", x: 560, y: 190, kind: "queue" },
    { id: "perf", label: "performance λ", meta: "Nova Pro · 180s", x: 700, y: 190, kind: "compute", key: true },
    { id: "qsty", label: "style-queue", x: 560, y: 300, kind: "queue" },
    { id: "sty", label: "style λ", meta: "Nova Micro · 60s", x: 700, y: 300, kind: "compute", key: true },
    { id: "qtst", label: "test-queue", x: 560, y: 410, kind: "queue" },
    { id: "tst", label: "test-coverage λ", meta: "Nova Micro · 60s", x: 700, y: 410, kind: "compute", key: true },

    { id: "ddb", label: "DynamoDB", meta: "single table · GSI on status", x: 848, y: 420, kind: "store", key: true },
    { id: "t3", label: "SNS", meta: "review-findings", x: 848, y: 250, kind: "topic" },
    { id: "qsum", label: "summary-queue", meta: "+ DLQ", x: 940, y: 250, kind: "queue" },
    { id: "sum", label: "summary λ", meta: "dedupe · rank · Jinja", x: 1040, y: 250, kind: "compute", key: true },
    { id: "comment", label: "One PR comment", meta: "severity-ranked", x: 1140, y: 160, kind: "sink", key: true },

    { id: "t4", label: "SNS", meta: "review-complete", x: 1040, y: 360, kind: "topic" },
    { id: "qlrn", label: "learn-queue", meta: "+ DLQ", x: 1040, y: 440, kind: "queue" },
    { id: "ltm", label: "ltm-writer λ", meta: "PATTERN# · TEAM#", x: 900, y: 490, kind: "compute", key: true },
  ],
  edges: [
    { from: "pr", to: "api", kind: "sync" },
    { from: "api", to: "hook", kind: "sync" },
    { from: "hook", to: "t1", kind: "async" },
    { from: "t1", to: "parseq", kind: "async" },
    { from: "parseq", to: "parser", kind: "async" },
    { from: "parser", to: "t2", kind: "async", bend: -30 },
    { from: "parser", to: "ddb", kind: "data", bend: 60 },

    { from: "t2", to: "qsec", kind: "async" },
    { from: "t2", to: "qperf", kind: "async" },
    { from: "t2", to: "qsty", kind: "async" },
    { from: "t2", to: "qtst", kind: "async" },
    { from: "qsec", to: "sec", kind: "async" },
    { from: "qperf", to: "perf", kind: "async" },
    { from: "qsty", to: "sty", kind: "async" },
    { from: "qtst", to: "tst", kind: "async" },

    { from: "sec", to: "t3", kind: "async" },
    { from: "perf", to: "t3", kind: "async" },
    { from: "sty", to: "t3", kind: "async" },
    { from: "tst", to: "t3", kind: "async" },
    { from: "t3", to: "qsum", kind: "async" },
    { from: "qsum", to: "sum", kind: "async" },
    { from: "ddb", to: "sum", kind: "data", bend: -40 },
    { from: "sum", to: "comment", kind: "sync" },

    { from: "sum", to: "t4", kind: "async" },
    { from: "t4", to: "qlrn", kind: "async" },
    { from: "qlrn", to: "ltm", kind: "async" },
    { from: "ltm", to: "ddb", kind: "data", bend: 20 },
  ],
  flow: ["pr", "api", "hook", "t1", "parseq", "parser", "t2", "qsec", "sec", "t3", "qsum", "sum", "comment"],
};
